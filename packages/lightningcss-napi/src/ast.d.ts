/**
 * Auto-generated TypeScript types for lightningcss AST.
 * Generated from ast.json via SchemaRepresentation.toCodeDocument.
 * Do not edit manually.
 */

export type Calc_for_DimensionPercentage_for_LengthValue =
	| { readonly type: "value"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
	| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
	| {
			readonly type: "sum";
			readonly value: readonly [
				Calc_for_DimensionPercentage_for_LengthValue,
				Calc_for_DimensionPercentage_for_LengthValue,
			];
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "product";
			readonly value: readonly [number, Calc_for_DimensionPercentage_for_LengthValue];
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "function";
			readonly value: MathFunction_for_DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  };

export type MathFunction_for_DimensionPercentage_for_LengthValue =
	| {
			readonly type: "calc";
			readonly value: Calc_for_DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "min";
			readonly value: ReadonlyArray<Calc_for_DimensionPercentage_for_LengthValue>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "max";
			readonly value: ReadonlyArray<Calc_for_DimensionPercentage_for_LengthValue>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "clamp";
			readonly value: readonly [
				Calc_for_DimensionPercentage_for_LengthValue,
				Calc_for_DimensionPercentage_for_LengthValue,
				Calc_for_DimensionPercentage_for_LengthValue,
			];
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "round";
			readonly value: readonly [
				RoundingStrategy,
				Calc_for_DimensionPercentage_for_LengthValue,
				Calc_for_DimensionPercentage_for_LengthValue,
			];
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "rem";
			readonly value: readonly [
				Calc_for_DimensionPercentage_for_LengthValue,
				Calc_for_DimensionPercentage_for_LengthValue,
			];
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "mod";
			readonly value: readonly [
				Calc_for_DimensionPercentage_for_LengthValue,
				Calc_for_DimensionPercentage_for_LengthValue,
			];
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "abs";
			readonly value: Calc_for_DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "sign";
			readonly value: Calc_for_DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "hypot";
			readonly value: ReadonlyArray<Calc_for_DimensionPercentage_for_LengthValue>;
			readonly [x: string]: unknown;
	  };

export type DimensionPercentage_for_LengthValue =
	| { readonly type: "dimension"; readonly value: LengthValue; readonly [x: string]: unknown }
	| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
	| {
			readonly type: "calc";
			readonly value: Calc_for_DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  };

export type ImageSet = {
	readonly options: ReadonlyArray<ImageSetOption>;
	readonly vendorPrefix: ReadonlyArray<Prefix>;
	readonly [x: string]: unknown;
};

export type ImageSetOption = {
	readonly fileType?: String | null;
	readonly image:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| { readonly type: "url"; readonly value: Url; readonly [x: string]: unknown }
		| { readonly type: "gradient"; readonly value: Gradient; readonly [x: string]: unknown }
		| { readonly type: "image-set"; readonly value: ImageSet; readonly [x: string]: unknown };
	readonly resolution:
		| { readonly type: "dpi"; readonly value: number; readonly [x: string]: unknown }
		| { readonly type: "dpcm"; readonly value: number; readonly [x: string]: unknown }
		| { readonly type: "dppx"; readonly value: number; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type CssColor =
	| { readonly type: "currentcolor"; readonly [x: string]: unknown }
	| {
			readonly alpha: number;
			readonly b: number;
			readonly g: number;
			readonly r: number;
			readonly type: "rgb";
			readonly [x: string]: unknown;
	  }
	| {
			readonly a: number;
			readonly alpha: number;
			readonly b: number;
			readonly l: number;
			readonly type: "lab";
			readonly [x: string]: unknown;
	  }
	| {
			readonly alpha: number;
			readonly c: number;
			readonly h: number;
			readonly l: number;
			readonly type: "lch";
			readonly [x: string]: unknown;
	  }
	| {
			readonly a: number;
			readonly alpha: number;
			readonly b: number;
			readonly l: number;
			readonly type: "oklab";
			readonly [x: string]: unknown;
	  }
	| {
			readonly alpha: number;
			readonly c: number;
			readonly h: number;
			readonly l: number;
			readonly type: "oklch";
			readonly [x: string]: unknown;
	  }
	| {
			readonly alpha: number;
			readonly b: number;
			readonly g: number;
			readonly r: number;
			readonly type: "srgb";
			readonly [x: string]: unknown;
	  }
	| {
			readonly alpha: number;
			readonly b: number;
			readonly g: number;
			readonly r: number;
			readonly type: "srgb-linear";
			readonly [x: string]: unknown;
	  }
	| {
			readonly alpha: number;
			readonly b: number;
			readonly g: number;
			readonly r: number;
			readonly type: "display-p3";
			readonly [x: string]: unknown;
	  }
	| {
			readonly alpha: number;
			readonly b: number;
			readonly g: number;
			readonly r: number;
			readonly type: "a98-rgb";
			readonly [x: string]: unknown;
	  }
	| {
			readonly alpha: number;
			readonly b: number;
			readonly g: number;
			readonly r: number;
			readonly type: "prophoto-rgb";
			readonly [x: string]: unknown;
	  }
	| {
			readonly alpha: number;
			readonly b: number;
			readonly g: number;
			readonly r: number;
			readonly type: "rec2020";
			readonly [x: string]: unknown;
	  }
	| {
			readonly alpha: number;
			readonly type: "xyz-d50";
			readonly x: number;
			readonly y: number;
			readonly z: number;
			readonly [x: string]: unknown;
	  }
	| {
			readonly alpha: number;
			readonly type: "xyz-d65";
			readonly x: number;
			readonly y: number;
			readonly z: number;
			readonly [x: string]: unknown;
	  }
	| {
			readonly alpha: number;
			readonly b: number;
			readonly g: number;
			readonly r: number;
			readonly type: "rgb";
			readonly [x: string]: unknown;
	  }
	| {
			readonly alpha: number;
			readonly h: number;
			readonly l: number;
			readonly s: number;
			readonly type: "hsl";
			readonly [x: string]: unknown;
	  }
	| {
			readonly alpha: number;
			readonly b: number;
			readonly h: number;
			readonly type: "hwb";
			readonly w: number;
			readonly [x: string]: unknown;
	  }
	| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
	| "accentcolor"
	| "accentcolortext"
	| "activetext"
	| "buttonborder"
	| "buttonface"
	| "buttontext"
	| "canvas"
	| "canvastext"
	| "field"
	| "fieldtext"
	| "graytext"
	| "highlight"
	| "highlighttext"
	| "linktext"
	| "mark"
	| "marktext"
	| "selecteditem"
	| "selecteditemtext"
	| "visitedtext"
	| "activeborder"
	| "activecaption"
	| "appworkspace"
	| "background"
	| "buttonhighlight"
	| "buttonshadow"
	| "captiontext"
	| "inactiveborder"
	| "inactivecaption"
	| "inactivecaptiontext"
	| "infobackground"
	| "infotext"
	| "menu"
	| "menutext"
	| "scrollbar"
	| "threeddarkshadow"
	| "threedface"
	| "threedhighlight"
	| "threedlightshadow"
	| "threedshadow"
	| "window"
	| "windowframe"
	| "windowtext";

export type Calc_for_DimensionPercentage_for_Angle =
	| { readonly type: "value"; readonly value: DimensionPercentage_for_Angle; readonly [x: string]: unknown }
	| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
	| {
			readonly type: "sum";
			readonly value: readonly [Calc_for_DimensionPercentage_for_Angle, Calc_for_DimensionPercentage_for_Angle];
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "product";
			readonly value: readonly [number, Calc_for_DimensionPercentage_for_Angle];
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "function";
			readonly value: MathFunction_for_DimensionPercentage_for_Angle;
			readonly [x: string]: unknown;
	  };

export type MathFunction_for_DimensionPercentage_for_Angle =
	| { readonly type: "calc"; readonly value: Calc_for_DimensionPercentage_for_Angle; readonly [x: string]: unknown }
	| {
			readonly type: "min";
			readonly value: ReadonlyArray<Calc_for_DimensionPercentage_for_Angle>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "max";
			readonly value: ReadonlyArray<Calc_for_DimensionPercentage_for_Angle>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "clamp";
			readonly value: readonly [
				Calc_for_DimensionPercentage_for_Angle,
				Calc_for_DimensionPercentage_for_Angle,
				Calc_for_DimensionPercentage_for_Angle,
			];
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "round";
			readonly value: readonly [
				RoundingStrategy,
				Calc_for_DimensionPercentage_for_Angle,
				Calc_for_DimensionPercentage_for_Angle,
			];
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "rem";
			readonly value: readonly [Calc_for_DimensionPercentage_for_Angle, Calc_for_DimensionPercentage_for_Angle];
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "mod";
			readonly value: readonly [Calc_for_DimensionPercentage_for_Angle, Calc_for_DimensionPercentage_for_Angle];
			readonly [x: string]: unknown;
	  }
	| { readonly type: "abs"; readonly value: Calc_for_DimensionPercentage_for_Angle; readonly [x: string]: unknown }
	| { readonly type: "sign"; readonly value: Calc_for_DimensionPercentage_for_Angle; readonly [x: string]: unknown }
	| {
			readonly type: "hypot";
			readonly value: ReadonlyArray<Calc_for_DimensionPercentage_for_Angle>;
			readonly [x: string]: unknown;
	  };

export type DimensionPercentage_for_Angle =
	| { readonly type: "dimension"; readonly value: Angle; readonly [x: string]: unknown }
	| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "calc"; readonly value: Calc_for_DimensionPercentage_for_Angle; readonly [x: string]: unknown };

export type Calc_for_Length =
	| { readonly type: "value"; readonly value: Length; readonly [x: string]: unknown }
	| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "sum"; readonly value: readonly [Calc_for_Length, Calc_for_Length]; readonly [x: string]: unknown }
	| { readonly type: "product"; readonly value: readonly [number, Calc_for_Length]; readonly [x: string]: unknown }
	| { readonly type: "function"; readonly value: MathFunction_for_Length; readonly [x: string]: unknown };

export type MathFunction_for_Length =
	| { readonly type: "calc"; readonly value: Calc_for_Length; readonly [x: string]: unknown }
	| { readonly type: "min"; readonly value: ReadonlyArray<Calc_for_Length>; readonly [x: string]: unknown }
	| { readonly type: "max"; readonly value: ReadonlyArray<Calc_for_Length>; readonly [x: string]: unknown }
	| {
			readonly type: "clamp";
			readonly value: readonly [Calc_for_Length, Calc_for_Length, Calc_for_Length];
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "round";
			readonly value: readonly [RoundingStrategy, Calc_for_Length, Calc_for_Length];
			readonly [x: string]: unknown;
	  }
	| { readonly type: "rem"; readonly value: readonly [Calc_for_Length, Calc_for_Length]; readonly [x: string]: unknown }
	| { readonly type: "mod"; readonly value: readonly [Calc_for_Length, Calc_for_Length]; readonly [x: string]: unknown }
	| { readonly type: "abs"; readonly value: Calc_for_Length; readonly [x: string]: unknown }
	| { readonly type: "sign"; readonly value: Calc_for_Length; readonly [x: string]: unknown }
	| { readonly type: "hypot"; readonly value: ReadonlyArray<Calc_for_Length>; readonly [x: string]: unknown };

export type Length =
	| { readonly type: "value"; readonly value: LengthValue; readonly [x: string]: unknown }
	| { readonly type: "calc"; readonly value: Calc_for_Length; readonly [x: string]: unknown };

export type TokenOrValue =
	| { readonly type: "token"; readonly value: Token; readonly [x: string]: unknown }
	| { readonly type: "color"; readonly value: CssColor; readonly [x: string]: unknown }
	| { readonly type: "unresolved-color"; readonly value: UnresolvedColor; readonly [x: string]: unknown }
	| { readonly type: "url"; readonly value: Url; readonly [x: string]: unknown }
	| { readonly type: "var"; readonly value: Variable; readonly [x: string]: unknown }
	| { readonly type: "env"; readonly value: EnvironmentVariable; readonly [x: string]: unknown }
	| { readonly type: "function"; readonly value: Function; readonly [x: string]: unknown }
	| { readonly type: "length"; readonly value: LengthValue; readonly [x: string]: unknown }
	| { readonly type: "angle"; readonly value: Angle; readonly [x: string]: unknown }
	| { readonly type: "time"; readonly value: Time; readonly [x: string]: unknown }
	| { readonly type: "resolution"; readonly value: Resolution; readonly [x: string]: unknown }
	| { readonly type: "dashed-ident"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "animation-name"; readonly value: AnimationName; readonly [x: string]: unknown };

export type Function = {
	readonly arguments: ReadonlyArray<TokenOrValue>;
	readonly name: string;
	readonly [x: string]: unknown;
};

export type UnresolvedColor =
	| {
			readonly alpha: ReadonlyArray<TokenOrValue>;
			readonly b: number;
			readonly g: number;
			readonly r: number;
			readonly type: "rgb";
			readonly [x: string]: unknown;
	  }
	| {
			readonly alpha: ReadonlyArray<TokenOrValue>;
			readonly h: number;
			readonly l: number;
			readonly s: number;
			readonly type: "hsl";
			readonly [x: string]: unknown;
	  }
	| {
			readonly dark: ReadonlyArray<TokenOrValue>;
			readonly light: ReadonlyArray<TokenOrValue>;
			readonly type: "light-dark";
			readonly [x: string]: unknown;
	  };

export type SelectorComponent =
	| { readonly type: "combinator"; readonly value: Combinator; readonly [x: string]: unknown }
	| { readonly type: "universal"; readonly [x: string]: unknown }
	| { readonly kind: "none"; readonly [x: string]: unknown }
	| { readonly kind: "any"; readonly [x: string]: unknown }
	| { readonly kind: "named"; readonly prefix: string; readonly [x: string]: unknown }
	| { readonly name: string; readonly type: "type"; readonly [x: string]: unknown }
	| { readonly name: string; readonly type: "id"; readonly [x: string]: unknown }
	| { readonly name: string; readonly type: "class"; readonly [x: string]: unknown }
	| {
			readonly name: string;
			readonly namespace?: NamespaceConstraint | null;
			readonly operation?: AttrOperation | null;
			readonly type: "attribute";
			readonly [x: string]: unknown;
	  }
	| TSPseudoClass
	| PseudoClass
	| BuiltinPseudoElement
	| PseudoElement
	| { readonly type: "nesting"; readonly [x: string]: unknown };

export type PseudoElement =
	| { readonly kind: "after"; readonly [x: string]: unknown }
	| { readonly kind: "before"; readonly [x: string]: unknown }
	| { readonly kind: "first-line"; readonly [x: string]: unknown }
	| { readonly kind: "first-letter"; readonly [x: string]: unknown }
	| { readonly kind: "details-content"; readonly [x: string]: unknown }
	| { readonly kind: "target-text"; readonly [x: string]: unknown }
	| { readonly kind: "selection"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly kind: "placeholder"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly kind: "highlight-function"; readonly name: string; readonly [x: string]: unknown }
	| { readonly kind: "marker"; readonly [x: string]: unknown }
	| { readonly kind: "backdrop"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly kind: "file-selector-button"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly kind: "webkit-scrollbar"; readonly value: WebKitScrollbarPseudoElement; readonly [x: string]: unknown }
	| { readonly kind: "cue"; readonly [x: string]: unknown }
	| { readonly kind: "cue-region"; readonly [x: string]: unknown }
	| {
			readonly kind: "cue-function";
			readonly selector: ReadonlyArray<SelectorComponent>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly kind: "cue-region-function";
			readonly selector: ReadonlyArray<SelectorComponent>;
			readonly [x: string]: unknown;
	  }
	| { readonly kind: "view-transition"; readonly [x: string]: unknown }
	| {
			readonly kind: "view-transition-group";
			readonly part: {
				readonly classes: ReadonlyArray<String>;
				readonly name?: ViewTransitionPartName | null;
				readonly [x: string]: unknown;
			};
			readonly [x: string]: unknown;
	  }
	| {
			readonly kind: "view-transition-image-pair";
			readonly part: {
				readonly classes: ReadonlyArray<String>;
				readonly name?: ViewTransitionPartName | null;
				readonly [x: string]: unknown;
			};
			readonly [x: string]: unknown;
	  }
	| {
			readonly kind: "view-transition-old";
			readonly part: {
				readonly classes: ReadonlyArray<String>;
				readonly name?: ViewTransitionPartName | null;
				readonly [x: string]: unknown;
			};
			readonly [x: string]: unknown;
	  }
	| {
			readonly kind: "view-transition-new";
			readonly part: {
				readonly classes: ReadonlyArray<String>;
				readonly name?: ViewTransitionPartName | null;
				readonly [x: string]: unknown;
			};
			readonly [x: string]: unknown;
	  }
	| { readonly identifier: string; readonly kind: "picker-function"; readonly [x: string]: unknown }
	| { readonly kind: "picker-icon"; readonly [x: string]: unknown }
	| { readonly kind: "checkmark"; readonly [x: string]: unknown }
	| { readonly kind: "grammar-error"; readonly [x: string]: unknown }
	| { readonly kind: "spelling-error"; readonly [x: string]: unknown }
	| { readonly kind: "custom"; readonly name: string; readonly [x: string]: unknown }
	| {
			readonly arguments: ReadonlyArray<TokenOrValue>;
			readonly kind: "custom-function";
			readonly name: string;
			readonly [x: string]: unknown;
	  };

export type BuiltinPseudoElement =
	| { readonly kind: "slotted"; readonly selector: Selector; readonly [x: string]: unknown }
	| { readonly kind: "part"; readonly names: ReadonlyArray<string>; readonly [x: string]: unknown };

export type Selector = ReadonlyArray<SelectorComponent>;

export type PseudoClass =
	| { readonly kind: "lang"; readonly languages: ReadonlyArray<String>; readonly [x: string]: unknown }
	| { readonly direction: "ltr" | "rtl"; readonly kind: "dir"; readonly [x: string]: unknown }
	| { readonly kind: "hover"; readonly [x: string]: unknown }
	| { readonly kind: "active"; readonly [x: string]: unknown }
	| { readonly kind: "focus"; readonly [x: string]: unknown }
	| { readonly kind: "focus-visible"; readonly [x: string]: unknown }
	| { readonly kind: "focus-within"; readonly [x: string]: unknown }
	| { readonly kind: "current"; readonly [x: string]: unknown }
	| { readonly kind: "past"; readonly [x: string]: unknown }
	| { readonly kind: "future"; readonly [x: string]: unknown }
	| { readonly kind: "playing"; readonly [x: string]: unknown }
	| { readonly kind: "paused"; readonly [x: string]: unknown }
	| { readonly kind: "seeking"; readonly [x: string]: unknown }
	| { readonly kind: "buffering"; readonly [x: string]: unknown }
	| { readonly kind: "stalled"; readonly [x: string]: unknown }
	| { readonly kind: "muted"; readonly [x: string]: unknown }
	| { readonly kind: "volume-locked"; readonly [x: string]: unknown }
	| { readonly kind: "fullscreen"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly kind: "open"; readonly [x: string]: unknown }
	| { readonly kind: "closed"; readonly [x: string]: unknown }
	| { readonly kind: "modal"; readonly [x: string]: unknown }
	| { readonly kind: "picture-in-picture"; readonly [x: string]: unknown }
	| { readonly kind: "popover-open"; readonly [x: string]: unknown }
	| { readonly kind: "defined"; readonly [x: string]: unknown }
	| { readonly kind: "any-link"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly kind: "link"; readonly [x: string]: unknown }
	| { readonly kind: "local-link"; readonly [x: string]: unknown }
	| { readonly kind: "target"; readonly [x: string]: unknown }
	| { readonly kind: "target-within"; readonly [x: string]: unknown }
	| { readonly kind: "visited"; readonly [x: string]: unknown }
	| { readonly kind: "enabled"; readonly [x: string]: unknown }
	| { readonly kind: "disabled"; readonly [x: string]: unknown }
	| { readonly kind: "read-only"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly kind: "read-write"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly kind: "placeholder-shown"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly kind: "default"; readonly [x: string]: unknown }
	| { readonly kind: "checked"; readonly [x: string]: unknown }
	| { readonly kind: "indeterminate"; readonly [x: string]: unknown }
	| { readonly kind: "blank"; readonly [x: string]: unknown }
	| { readonly kind: "valid"; readonly [x: string]: unknown }
	| { readonly kind: "invalid"; readonly [x: string]: unknown }
	| { readonly kind: "in-range"; readonly [x: string]: unknown }
	| { readonly kind: "out-of-range"; readonly [x: string]: unknown }
	| { readonly kind: "required"; readonly [x: string]: unknown }
	| { readonly kind: "optional"; readonly [x: string]: unknown }
	| { readonly kind: "user-valid"; readonly [x: string]: unknown }
	| { readonly kind: "user-invalid"; readonly [x: string]: unknown }
	| { readonly kind: "autofill"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly kind: "active-view-transition"; readonly [x: string]: unknown }
	| {
			readonly kind: "active-view-transition-type";
			readonly type: ReadonlyArray<String>;
			readonly [x: string]: unknown;
	  }
	| { readonly kind: "state"; readonly state: string; readonly [x: string]: unknown }
	| { readonly kind: "local"; readonly selector: ReadonlyArray<SelectorComponent>; readonly [x: string]: unknown }
	| { readonly kind: "global"; readonly selector: ReadonlyArray<SelectorComponent>; readonly [x: string]: unknown }
	| { readonly kind: "webkit-scrollbar"; readonly value: WebKitScrollbarPseudoClass; readonly [x: string]: unknown }
	| { readonly kind: "custom"; readonly name: string; readonly [x: string]: unknown }
	| {
			readonly arguments: ReadonlyArray<TokenOrValue>;
			readonly kind: "custom-function";
			readonly name: string;
			readonly [x: string]: unknown;
	  };

export type TSPseudoClass =
	| { readonly kind: "not"; readonly selectors: ReadonlyArray<Selector>; readonly [x: string]: unknown }
	| { readonly kind: "first-child"; readonly [x: string]: unknown }
	| { readonly kind: "last-child"; readonly [x: string]: unknown }
	| { readonly kind: "only-child"; readonly [x: string]: unknown }
	| { readonly kind: "root"; readonly [x: string]: unknown }
	| { readonly kind: "empty"; readonly [x: string]: unknown }
	| { readonly kind: "scope"; readonly [x: string]: unknown }
	| {
			readonly a: number;
			readonly b: number;
			readonly kind: "nth-child";
			readonly of?: ReadonlyArray<unknown> | null;
			readonly [x: string]: unknown;
	  }
	| {
			readonly a: number;
			readonly b: number;
			readonly kind: "nth-last-child";
			readonly of?: ReadonlyArray<unknown> | null;
			readonly [x: string]: unknown;
	  }
	| { readonly a: number; readonly b: number; readonly kind: "nth-col"; readonly [x: string]: unknown }
	| { readonly a: number; readonly b: number; readonly kind: "nth-last-col"; readonly [x: string]: unknown }
	| { readonly a: number; readonly b: number; readonly kind: "nth-of-type"; readonly [x: string]: unknown }
	| { readonly a: number; readonly b: number; readonly kind: "nth-last-of-type"; readonly [x: string]: unknown }
	| { readonly kind: "first-of-type"; readonly [x: string]: unknown }
	| { readonly kind: "last-of-type"; readonly [x: string]: unknown }
	| { readonly kind: "only-of-type"; readonly [x: string]: unknown }
	| { readonly kind: "host"; readonly selectors?: Selector | null; readonly [x: string]: unknown }
	| { readonly kind: "where"; readonly selectors: ReadonlyArray<Selector>; readonly [x: string]: unknown }
	| { readonly kind: "is"; readonly selectors: ReadonlyArray<Selector>; readonly [x: string]: unknown }
	| {
			readonly kind: "any";
			readonly selectors: ReadonlyArray<Selector>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly kind: "has"; readonly selectors: ReadonlyArray<Selector>; readonly [x: string]: unknown };

export type ScrollStateQuery =
	| { readonly type: "feature"; readonly value: QueryFeature_for_ScrollStateFeatureId; readonly [x: string]: unknown }
	| { readonly type: "not"; readonly value: ScrollStateQuery; readonly [x: string]: unknown }
	| {
			readonly conditions: ReadonlyArray<ScrollStateQuery>;
			readonly operator: "and" | "or";
			readonly type: "operation";
			readonly [x: string]: unknown;
	  };

export type StyleQuery =
	| { readonly type: "declaration"; readonly value: Declaration; readonly [x: string]: unknown }
	| { readonly type: "property"; readonly value: PropertyId; readonly [x: string]: unknown }
	| { readonly type: "not"; readonly value: StyleQuery; readonly [x: string]: unknown }
	| {
			readonly conditions: ReadonlyArray<StyleQuery>;
			readonly operator: "and" | "or";
			readonly type: "operation";
			readonly [x: string]: unknown;
	  };

export type ContainerCondition =
	| { readonly type: "feature"; readonly value: QueryFeature_for_ContainerSizeFeatureId; readonly [x: string]: unknown }
	| { readonly type: "not"; readonly value: ContainerCondition; readonly [x: string]: unknown }
	| {
			readonly conditions: ReadonlyArray<ContainerCondition>;
			readonly operator: "and" | "or";
			readonly type: "operation";
			readonly [x: string]: unknown;
	  }
	| { readonly type: "style"; readonly value: StyleQuery; readonly [x: string]: unknown }
	| { readonly type: "scroll-state"; readonly value: ScrollStateQuery; readonly [x: string]: unknown }
	| { readonly type: "unknown"; readonly value: ReadonlyArray<TokenOrValue>; readonly [x: string]: unknown };

export type Rule =
	| { readonly type: "media"; readonly value: MediaRule_for_DefaultAtRule; readonly [x: string]: unknown }
	| { readonly type: "import"; readonly value: ImportRule; readonly [x: string]: unknown }
	| { readonly type: "style"; readonly value: StyleRule_for_DefaultAtRule; readonly [x: string]: unknown }
	| { readonly type: "keyframes"; readonly value: KeyframesRule; readonly [x: string]: unknown }
	| { readonly type: "font-face"; readonly value: FontFaceRule; readonly [x: string]: unknown }
	| { readonly type: "font-palette-values"; readonly value: FontPaletteValuesRule; readonly [x: string]: unknown }
	| { readonly type: "font-feature-values"; readonly value: FontFeatureValuesRule; readonly [x: string]: unknown }
	| { readonly type: "page"; readonly value: PageRule; readonly [x: string]: unknown }
	| { readonly type: "supports"; readonly value: SupportsRule_for_DefaultAtRule; readonly [x: string]: unknown }
	| { readonly type: "counter-style"; readonly value: CounterStyleRule; readonly [x: string]: unknown }
	| { readonly type: "namespace"; readonly value: NamespaceRule; readonly [x: string]: unknown }
	| { readonly type: "moz-document"; readonly value: MozDocumentRule_for_DefaultAtRule; readonly [x: string]: unknown }
	| { readonly type: "nesting"; readonly value: NestingRule_for_DefaultAtRule; readonly [x: string]: unknown }
	| { readonly type: "nested-declarations"; readonly value: NestedDeclarationsRule; readonly [x: string]: unknown }
	| { readonly type: "viewport"; readonly value: ViewportRule; readonly [x: string]: unknown }
	| { readonly type: "custom-media"; readonly value: CustomMediaRule; readonly [x: string]: unknown }
	| { readonly type: "layer-statement"; readonly value: LayerStatementRule; readonly [x: string]: unknown }
	| { readonly type: "layer-block"; readonly value: LayerBlockRule_for_DefaultAtRule; readonly [x: string]: unknown }
	| { readonly type: "property"; readonly value: PropertyRule; readonly [x: string]: unknown }
	| { readonly type: "container"; readonly value: ContainerRule_for_DefaultAtRule; readonly [x: string]: unknown }
	| { readonly type: "scope"; readonly value: ScopeRule_for_DefaultAtRule; readonly [x: string]: unknown }
	| {
			readonly type: "starting-style";
			readonly value: StartingStyleRule_for_DefaultAtRule;
			readonly [x: string]: unknown;
	  }
	| { readonly type: "view-transition"; readonly value: ViewTransitionRule; readonly [x: string]: unknown }
	| { readonly type: "ignored"; readonly [x: string]: unknown }
	| { readonly type: "unknown"; readonly value: UnknownAtRule; readonly [x: string]: unknown }
	| { readonly type: "custom"; readonly value: DefaultAtRule; readonly [x: string]: unknown };

export type StartingStyleRule_for_DefaultAtRule = {
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly rules: ReadonlyArray<Rule>;
	readonly [x: string]: unknown;
};

export type ScopeRule_for_DefaultAtRule = {
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly rules: ReadonlyArray<Rule>;
	readonly scopeEnd?: SelectorList | null;
	readonly scopeStart?: SelectorList | null;
	readonly [x: string]: unknown;
};

export type ContainerRule_for_DefaultAtRule = {
	readonly condition?: ContainerCondition | null;
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly name?: String | null;
	readonly rules: ReadonlyArray<Rule>;
	readonly [x: string]: unknown;
};

export type ParsedComponent =
	| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown }
	| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
	| {
			readonly type: "length-percentage";
			readonly value: DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  }
	| { readonly type: "string"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "color"; readonly value: CssColor; readonly [x: string]: unknown }
	| { readonly type: "image"; readonly value: Image; readonly [x: string]: unknown }
	| { readonly type: "url"; readonly value: Url; readonly [x: string]: unknown }
	| { readonly type: "integer"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "angle"; readonly value: Angle; readonly [x: string]: unknown }
	| { readonly type: "time"; readonly value: Time; readonly [x: string]: unknown }
	| { readonly type: "resolution"; readonly value: Resolution; readonly [x: string]: unknown }
	| { readonly type: "transform-function"; readonly value: Transform; readonly [x: string]: unknown }
	| { readonly type: "transform-list"; readonly value: ReadonlyArray<Transform>; readonly [x: string]: unknown }
	| { readonly type: "custom-ident"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "literal"; readonly value: String; readonly [x: string]: unknown }
	| {
			readonly type: "repeated";
			readonly value: {
				readonly components: ReadonlyArray<ParsedComponent>;
				readonly multiplier:
					| { readonly type: "none"; readonly [x: string]: unknown }
					| { readonly type: "space"; readonly [x: string]: unknown }
					| { readonly type: "comma"; readonly [x: string]: unknown };
				readonly [x: string]: unknown;
			};
			readonly [x: string]: unknown;
	  }
	| { readonly type: "token-list"; readonly value: ReadonlyArray<TokenOrValue>; readonly [x: string]: unknown };

export type LayerBlockRule_for_DefaultAtRule = {
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly name?: ReadonlyArray<unknown> | null;
	readonly rules: ReadonlyArray<Rule>;
	readonly [x: string]: unknown;
};

export type MediaCondition =
	| { readonly type: "feature"; readonly value: QueryFeature_for_MediaFeatureId; readonly [x: string]: unknown }
	| { readonly type: "not"; readonly value: MediaCondition; readonly [x: string]: unknown }
	| {
			readonly conditions: ReadonlyArray<MediaCondition>;
			readonly operator: "and" | "or";
			readonly type: "operation";
			readonly [x: string]: unknown;
	  }
	| { readonly type: "unknown"; readonly value: ReadonlyArray<TokenOrValue>; readonly [x: string]: unknown };

export type NestingRule_for_DefaultAtRule = {
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly style: {
		readonly declarations?: {
			readonly declarations?: ReadonlyArray<Declaration>;
			readonly importantDeclarations?: ReadonlyArray<Declaration>;
			readonly [x: string]: unknown;
		};
		readonly loc: {
			readonly column: number;
			readonly line: number;
			readonly source_index: number;
			readonly [x: string]: unknown;
		};
		readonly rules?: ReadonlyArray<Rule>;
		readonly selectors: ReadonlyArray<Selector>;
		readonly [x: string]: unknown;
	};
	readonly [x: string]: unknown;
};

export type MozDocumentRule_for_DefaultAtRule = {
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly rules: ReadonlyArray<Rule>;
	readonly [x: string]: unknown;
};

export type SupportsRule_for_DefaultAtRule = {
	readonly condition:
		| { readonly type: "not"; readonly value: SupportsCondition; readonly [x: string]: unknown }
		| { readonly type: "and"; readonly value: ReadonlyArray<SupportsCondition>; readonly [x: string]: unknown }
		| { readonly type: "or"; readonly value: ReadonlyArray<SupportsCondition>; readonly [x: string]: unknown }
		| {
				readonly propertyId:
					| { readonly property: "background-color"; readonly [x: string]: unknown }
					| { readonly property: "background-image"; readonly [x: string]: unknown }
					| { readonly property: "background-position-x"; readonly [x: string]: unknown }
					| { readonly property: "background-position-y"; readonly [x: string]: unknown }
					| { readonly property: "background-position"; readonly [x: string]: unknown }
					| { readonly property: "background-size"; readonly [x: string]: unknown }
					| { readonly property: "background-repeat"; readonly [x: string]: unknown }
					| { readonly property: "background-attachment"; readonly [x: string]: unknown }
					| { readonly property: "background-clip"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "background-origin"; readonly [x: string]: unknown }
					| { readonly property: "background"; readonly [x: string]: unknown }
					| { readonly property: "box-shadow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "opacity"; readonly [x: string]: unknown }
					| { readonly property: "color"; readonly [x: string]: unknown }
					| { readonly property: "display"; readonly [x: string]: unknown }
					| { readonly property: "visibility"; readonly [x: string]: unknown }
					| { readonly property: "width"; readonly [x: string]: unknown }
					| { readonly property: "height"; readonly [x: string]: unknown }
					| { readonly property: "min-width"; readonly [x: string]: unknown }
					| { readonly property: "min-height"; readonly [x: string]: unknown }
					| { readonly property: "max-width"; readonly [x: string]: unknown }
					| { readonly property: "max-height"; readonly [x: string]: unknown }
					| { readonly property: "block-size"; readonly [x: string]: unknown }
					| { readonly property: "inline-size"; readonly [x: string]: unknown }
					| { readonly property: "min-block-size"; readonly [x: string]: unknown }
					| { readonly property: "min-inline-size"; readonly [x: string]: unknown }
					| { readonly property: "max-block-size"; readonly [x: string]: unknown }
					| { readonly property: "max-inline-size"; readonly [x: string]: unknown }
					| { readonly property: "box-sizing"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "aspect-ratio"; readonly [x: string]: unknown }
					| { readonly property: "overflow"; readonly [x: string]: unknown }
					| { readonly property: "overflow-x"; readonly [x: string]: unknown }
					| { readonly property: "overflow-y"; readonly [x: string]: unknown }
					| { readonly property: "text-overflow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "position"; readonly [x: string]: unknown }
					| { readonly property: "top"; readonly [x: string]: unknown }
					| { readonly property: "bottom"; readonly [x: string]: unknown }
					| { readonly property: "left"; readonly [x: string]: unknown }
					| { readonly property: "right"; readonly [x: string]: unknown }
					| { readonly property: "inset-block-start"; readonly [x: string]: unknown }
					| { readonly property: "inset-block-end"; readonly [x: string]: unknown }
					| { readonly property: "inset-inline-start"; readonly [x: string]: unknown }
					| { readonly property: "inset-inline-end"; readonly [x: string]: unknown }
					| { readonly property: "inset-block"; readonly [x: string]: unknown }
					| { readonly property: "inset-inline"; readonly [x: string]: unknown }
					| { readonly property: "inset"; readonly [x: string]: unknown }
					| { readonly property: "border-spacing"; readonly [x: string]: unknown }
					| { readonly property: "border-top-color"; readonly [x: string]: unknown }
					| { readonly property: "border-bottom-color"; readonly [x: string]: unknown }
					| { readonly property: "border-left-color"; readonly [x: string]: unknown }
					| { readonly property: "border-right-color"; readonly [x: string]: unknown }
					| { readonly property: "border-block-start-color"; readonly [x: string]: unknown }
					| { readonly property: "border-block-end-color"; readonly [x: string]: unknown }
					| { readonly property: "border-inline-start-color"; readonly [x: string]: unknown }
					| { readonly property: "border-inline-end-color"; readonly [x: string]: unknown }
					| { readonly property: "border-top-style"; readonly [x: string]: unknown }
					| { readonly property: "border-bottom-style"; readonly [x: string]: unknown }
					| { readonly property: "border-left-style"; readonly [x: string]: unknown }
					| { readonly property: "border-right-style"; readonly [x: string]: unknown }
					| { readonly property: "border-block-start-style"; readonly [x: string]: unknown }
					| { readonly property: "border-block-end-style"; readonly [x: string]: unknown }
					| { readonly property: "border-inline-start-style"; readonly [x: string]: unknown }
					| { readonly property: "border-inline-end-style"; readonly [x: string]: unknown }
					| { readonly property: "border-top-width"; readonly [x: string]: unknown }
					| { readonly property: "border-bottom-width"; readonly [x: string]: unknown }
					| { readonly property: "border-left-width"; readonly [x: string]: unknown }
					| { readonly property: "border-right-width"; readonly [x: string]: unknown }
					| { readonly property: "border-block-start-width"; readonly [x: string]: unknown }
					| { readonly property: "border-block-end-width"; readonly [x: string]: unknown }
					| { readonly property: "border-inline-start-width"; readonly [x: string]: unknown }
					| { readonly property: "border-inline-end-width"; readonly [x: string]: unknown }
					| {
							readonly property: "border-top-left-radius";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "border-top-right-radius";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "border-bottom-left-radius";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "border-bottom-right-radius";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "border-start-start-radius"; readonly [x: string]: unknown }
					| { readonly property: "border-start-end-radius"; readonly [x: string]: unknown }
					| { readonly property: "border-end-start-radius"; readonly [x: string]: unknown }
					| { readonly property: "border-end-end-radius"; readonly [x: string]: unknown }
					| { readonly property: "border-radius"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "border-image-source"; readonly [x: string]: unknown }
					| { readonly property: "border-image-outset"; readonly [x: string]: unknown }
					| { readonly property: "border-image-repeat"; readonly [x: string]: unknown }
					| { readonly property: "border-image-width"; readonly [x: string]: unknown }
					| { readonly property: "border-image-slice"; readonly [x: string]: unknown }
					| { readonly property: "border-image"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "border-color"; readonly [x: string]: unknown }
					| { readonly property: "border-style"; readonly [x: string]: unknown }
					| { readonly property: "border-width"; readonly [x: string]: unknown }
					| { readonly property: "border-block-color"; readonly [x: string]: unknown }
					| { readonly property: "border-block-style"; readonly [x: string]: unknown }
					| { readonly property: "border-block-width"; readonly [x: string]: unknown }
					| { readonly property: "border-inline-color"; readonly [x: string]: unknown }
					| { readonly property: "border-inline-style"; readonly [x: string]: unknown }
					| { readonly property: "border-inline-width"; readonly [x: string]: unknown }
					| { readonly property: "border"; readonly [x: string]: unknown }
					| { readonly property: "border-top"; readonly [x: string]: unknown }
					| { readonly property: "border-bottom"; readonly [x: string]: unknown }
					| { readonly property: "border-left"; readonly [x: string]: unknown }
					| { readonly property: "border-right"; readonly [x: string]: unknown }
					| { readonly property: "border-block"; readonly [x: string]: unknown }
					| { readonly property: "border-block-start"; readonly [x: string]: unknown }
					| { readonly property: "border-block-end"; readonly [x: string]: unknown }
					| { readonly property: "border-inline"; readonly [x: string]: unknown }
					| { readonly property: "border-inline-start"; readonly [x: string]: unknown }
					| { readonly property: "border-inline-end"; readonly [x: string]: unknown }
					| { readonly property: "outline"; readonly [x: string]: unknown }
					| { readonly property: "outline-color"; readonly [x: string]: unknown }
					| { readonly property: "outline-style"; readonly [x: string]: unknown }
					| { readonly property: "outline-width"; readonly [x: string]: unknown }
					| { readonly property: "flex-direction"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "flex-wrap"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "flex-flow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "flex-grow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "flex-shrink"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "flex-basis"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "flex"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "order"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "align-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "justify-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "place-content"; readonly [x: string]: unknown }
					| { readonly property: "align-self"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "justify-self"; readonly [x: string]: unknown }
					| { readonly property: "place-self"; readonly [x: string]: unknown }
					| { readonly property: "align-items"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "justify-items"; readonly [x: string]: unknown }
					| { readonly property: "place-items"; readonly [x: string]: unknown }
					| { readonly property: "row-gap"; readonly [x: string]: unknown }
					| { readonly property: "column-gap"; readonly [x: string]: unknown }
					| { readonly property: "gap"; readonly [x: string]: unknown }
					| { readonly property: "box-orient"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "box-direction"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| {
							readonly property: "box-ordinal-group";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "box-align"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "box-flex"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "box-flex-group"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "box-pack"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "box-lines"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "flex-pack"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "flex-order"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "flex-align"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "flex-item-align"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "flex-line-pack"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "flex-positive"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "flex-negative"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| {
							readonly property: "flex-preferred-size";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "grid-template-columns"; readonly [x: string]: unknown }
					| { readonly property: "grid-template-rows"; readonly [x: string]: unknown }
					| { readonly property: "grid-auto-columns"; readonly [x: string]: unknown }
					| { readonly property: "grid-auto-rows"; readonly [x: string]: unknown }
					| { readonly property: "grid-auto-flow"; readonly [x: string]: unknown }
					| { readonly property: "grid-template-areas"; readonly [x: string]: unknown }
					| { readonly property: "grid-template"; readonly [x: string]: unknown }
					| { readonly property: "grid"; readonly [x: string]: unknown }
					| { readonly property: "grid-row-start"; readonly [x: string]: unknown }
					| { readonly property: "grid-row-end"; readonly [x: string]: unknown }
					| { readonly property: "grid-column-start"; readonly [x: string]: unknown }
					| { readonly property: "grid-column-end"; readonly [x: string]: unknown }
					| { readonly property: "grid-row"; readonly [x: string]: unknown }
					| { readonly property: "grid-column"; readonly [x: string]: unknown }
					| { readonly property: "grid-area"; readonly [x: string]: unknown }
					| { readonly property: "margin-top"; readonly [x: string]: unknown }
					| { readonly property: "margin-bottom"; readonly [x: string]: unknown }
					| { readonly property: "margin-left"; readonly [x: string]: unknown }
					| { readonly property: "margin-right"; readonly [x: string]: unknown }
					| { readonly property: "margin-block-start"; readonly [x: string]: unknown }
					| { readonly property: "margin-block-end"; readonly [x: string]: unknown }
					| { readonly property: "margin-inline-start"; readonly [x: string]: unknown }
					| { readonly property: "margin-inline-end"; readonly [x: string]: unknown }
					| { readonly property: "margin-block"; readonly [x: string]: unknown }
					| { readonly property: "margin-inline"; readonly [x: string]: unknown }
					| { readonly property: "margin"; readonly [x: string]: unknown }
					| { readonly property: "padding-top"; readonly [x: string]: unknown }
					| { readonly property: "padding-bottom"; readonly [x: string]: unknown }
					| { readonly property: "padding-left"; readonly [x: string]: unknown }
					| { readonly property: "padding-right"; readonly [x: string]: unknown }
					| { readonly property: "padding-block-start"; readonly [x: string]: unknown }
					| { readonly property: "padding-block-end"; readonly [x: string]: unknown }
					| { readonly property: "padding-inline-start"; readonly [x: string]: unknown }
					| { readonly property: "padding-inline-end"; readonly [x: string]: unknown }
					| { readonly property: "padding-block"; readonly [x: string]: unknown }
					| { readonly property: "padding-inline"; readonly [x: string]: unknown }
					| { readonly property: "padding"; readonly [x: string]: unknown }
					| { readonly property: "scroll-margin-top"; readonly [x: string]: unknown }
					| { readonly property: "scroll-margin-bottom"; readonly [x: string]: unknown }
					| { readonly property: "scroll-margin-left"; readonly [x: string]: unknown }
					| { readonly property: "scroll-margin-right"; readonly [x: string]: unknown }
					| { readonly property: "scroll-margin-block-start"; readonly [x: string]: unknown }
					| { readonly property: "scroll-margin-block-end"; readonly [x: string]: unknown }
					| { readonly property: "scroll-margin-inline-start"; readonly [x: string]: unknown }
					| { readonly property: "scroll-margin-inline-end"; readonly [x: string]: unknown }
					| { readonly property: "scroll-margin-block"; readonly [x: string]: unknown }
					| { readonly property: "scroll-margin-inline"; readonly [x: string]: unknown }
					| { readonly property: "scroll-margin"; readonly [x: string]: unknown }
					| { readonly property: "scroll-padding-top"; readonly [x: string]: unknown }
					| { readonly property: "scroll-padding-bottom"; readonly [x: string]: unknown }
					| { readonly property: "scroll-padding-left"; readonly [x: string]: unknown }
					| { readonly property: "scroll-padding-right"; readonly [x: string]: unknown }
					| { readonly property: "scroll-padding-block-start"; readonly [x: string]: unknown }
					| { readonly property: "scroll-padding-block-end"; readonly [x: string]: unknown }
					| { readonly property: "scroll-padding-inline-start"; readonly [x: string]: unknown }
					| { readonly property: "scroll-padding-inline-end"; readonly [x: string]: unknown }
					| { readonly property: "scroll-padding-block"; readonly [x: string]: unknown }
					| { readonly property: "scroll-padding-inline"; readonly [x: string]: unknown }
					| { readonly property: "scroll-padding"; readonly [x: string]: unknown }
					| { readonly property: "font-weight"; readonly [x: string]: unknown }
					| { readonly property: "font-size"; readonly [x: string]: unknown }
					| { readonly property: "font-stretch"; readonly [x: string]: unknown }
					| { readonly property: "font-family"; readonly [x: string]: unknown }
					| { readonly property: "font-style"; readonly [x: string]: unknown }
					| { readonly property: "font-variant-caps"; readonly [x: string]: unknown }
					| { readonly property: "line-height"; readonly [x: string]: unknown }
					| { readonly property: "font"; readonly [x: string]: unknown }
					| { readonly property: "vertical-align"; readonly [x: string]: unknown }
					| { readonly property: "font-palette"; readonly [x: string]: unknown }
					| {
							readonly property: "transition-property";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "transition-duration";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "transition-delay";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "transition-timing-function";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "transition"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "animation-name"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| {
							readonly property: "animation-duration";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "animation-timing-function";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "animation-iteration-count";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "animation-direction";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "animation-play-state";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "animation-delay"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| {
							readonly property: "animation-fill-mode";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "animation-composition"; readonly [x: string]: unknown }
					| { readonly property: "animation-timeline"; readonly [x: string]: unknown }
					| { readonly property: "animation-range-start"; readonly [x: string]: unknown }
					| { readonly property: "animation-range-end"; readonly [x: string]: unknown }
					| { readonly property: "animation-range"; readonly [x: string]: unknown }
					| { readonly property: "animation"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "transform"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| {
							readonly property: "transform-origin";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "transform-style"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "transform-box"; readonly [x: string]: unknown }
					| {
							readonly property: "backface-visibility";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "perspective"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| {
							readonly property: "perspective-origin";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "translate"; readonly [x: string]: unknown }
					| { readonly property: "rotate"; readonly [x: string]: unknown }
					| { readonly property: "scale"; readonly [x: string]: unknown }
					| { readonly property: "text-transform"; readonly [x: string]: unknown }
					| { readonly property: "white-space"; readonly [x: string]: unknown }
					| { readonly property: "tab-size"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "word-break"; readonly [x: string]: unknown }
					| { readonly property: "line-break"; readonly [x: string]: unknown }
					| { readonly property: "hyphens"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "overflow-wrap"; readonly [x: string]: unknown }
					| { readonly property: "word-wrap"; readonly [x: string]: unknown }
					| { readonly property: "text-align"; readonly [x: string]: unknown }
					| { readonly property: "text-align-last"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "text-justify"; readonly [x: string]: unknown }
					| { readonly property: "word-spacing"; readonly [x: string]: unknown }
					| { readonly property: "letter-spacing"; readonly [x: string]: unknown }
					| { readonly property: "text-indent"; readonly [x: string]: unknown }
					| {
							readonly property: "text-decoration-line";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "text-decoration-style";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "text-decoration-color";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "text-decoration-thickness"; readonly [x: string]: unknown }
					| { readonly property: "text-decoration"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| {
							readonly property: "text-decoration-skip-ink";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "text-emphasis-style";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "text-emphasis-color";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "text-emphasis"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| {
							readonly property: "text-emphasis-position";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "text-shadow"; readonly [x: string]: unknown }
					| {
							readonly property: "text-size-adjust";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "direction"; readonly [x: string]: unknown }
					| { readonly property: "unicode-bidi"; readonly [x: string]: unknown }
					| {
							readonly property: "box-decoration-break";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "resize"; readonly [x: string]: unknown }
					| { readonly property: "cursor"; readonly [x: string]: unknown }
					| { readonly property: "caret-color"; readonly [x: string]: unknown }
					| { readonly property: "caret-shape"; readonly [x: string]: unknown }
					| { readonly property: "caret"; readonly [x: string]: unknown }
					| { readonly property: "user-select"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "accent-color"; readonly [x: string]: unknown }
					| { readonly property: "appearance"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "list-style-type"; readonly [x: string]: unknown }
					| { readonly property: "list-style-image"; readonly [x: string]: unknown }
					| { readonly property: "list-style-position"; readonly [x: string]: unknown }
					| { readonly property: "list-style"; readonly [x: string]: unknown }
					| { readonly property: "marker-side"; readonly [x: string]: unknown }
					| { readonly property: "composes"; readonly [x: string]: unknown }
					| { readonly property: "fill"; readonly [x: string]: unknown }
					| { readonly property: "fill-rule"; readonly [x: string]: unknown }
					| { readonly property: "fill-opacity"; readonly [x: string]: unknown }
					| { readonly property: "stroke"; readonly [x: string]: unknown }
					| { readonly property: "stroke-opacity"; readonly [x: string]: unknown }
					| { readonly property: "stroke-width"; readonly [x: string]: unknown }
					| { readonly property: "stroke-linecap"; readonly [x: string]: unknown }
					| { readonly property: "stroke-linejoin"; readonly [x: string]: unknown }
					| { readonly property: "stroke-miterlimit"; readonly [x: string]: unknown }
					| { readonly property: "stroke-dasharray"; readonly [x: string]: unknown }
					| { readonly property: "stroke-dashoffset"; readonly [x: string]: unknown }
					| { readonly property: "marker-start"; readonly [x: string]: unknown }
					| { readonly property: "marker-mid"; readonly [x: string]: unknown }
					| { readonly property: "marker-end"; readonly [x: string]: unknown }
					| { readonly property: "marker"; readonly [x: string]: unknown }
					| { readonly property: "color-interpolation"; readonly [x: string]: unknown }
					| { readonly property: "color-interpolation-filters"; readonly [x: string]: unknown }
					| { readonly property: "color-rendering"; readonly [x: string]: unknown }
					| { readonly property: "shape-rendering"; readonly [x: string]: unknown }
					| { readonly property: "text-rendering"; readonly [x: string]: unknown }
					| { readonly property: "image-rendering"; readonly [x: string]: unknown }
					| { readonly property: "clip-path"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "clip-rule"; readonly [x: string]: unknown }
					| { readonly property: "mask-image"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "mask-mode"; readonly [x: string]: unknown }
					| { readonly property: "mask-repeat"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "mask-position-x"; readonly [x: string]: unknown }
					| { readonly property: "mask-position-y"; readonly [x: string]: unknown }
					| { readonly property: "mask-position"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "mask-clip"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "mask-origin"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "mask-size"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "mask-composite"; readonly [x: string]: unknown }
					| { readonly property: "mask-type"; readonly [x: string]: unknown }
					| { readonly property: "mask"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "mask-border-source"; readonly [x: string]: unknown }
					| { readonly property: "mask-border-mode"; readonly [x: string]: unknown }
					| { readonly property: "mask-border-slice"; readonly [x: string]: unknown }
					| { readonly property: "mask-border-width"; readonly [x: string]: unknown }
					| { readonly property: "mask-border-outset"; readonly [x: string]: unknown }
					| { readonly property: "mask-border-repeat"; readonly [x: string]: unknown }
					| { readonly property: "mask-border"; readonly [x: string]: unknown }
					| { readonly property: "-webkit-mask-composite"; readonly [x: string]: unknown }
					| {
							readonly property: "mask-source-type";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "mask-box-image"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| {
							readonly property: "mask-box-image-source";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "mask-box-image-slice";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "mask-box-image-width";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "mask-box-image-outset";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| {
							readonly property: "mask-box-image-repeat";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "filter"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "backdrop-filter"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
					| { readonly property: "mix-blend-mode"; readonly [x: string]: unknown }
					| { readonly property: "z-index"; readonly [x: string]: unknown }
					| { readonly property: "container-type"; readonly [x: string]: unknown }
					| { readonly property: "container-name"; readonly [x: string]: unknown }
					| { readonly property: "container"; readonly [x: string]: unknown }
					| { readonly property: "view-transition-name"; readonly [x: string]: unknown }
					| { readonly property: "view-transition-class"; readonly [x: string]: unknown }
					| { readonly property: "view-transition-group"; readonly [x: string]: unknown }
					| { readonly property: "color-scheme"; readonly [x: string]: unknown }
					| {
							readonly property: "print-color-adjust";
							readonly vendorPrefix: VendorPrefix;
							readonly [x: string]: unknown;
					  }
					| { readonly property: "all"; readonly [x: string]: unknown }
					| { readonly property: string; readonly [x: string]: unknown };
				readonly type: "declaration";
				readonly value: string;
				readonly [x: string]: unknown;
		  }
		| { readonly type: "selector"; readonly value: String; readonly [x: string]: unknown }
		| { readonly type: "unknown"; readonly value: String; readonly [x: string]: unknown };
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly rules: ReadonlyArray<Rule>;
	readonly [x: string]: unknown;
};

export type SupportsCondition =
	| { readonly type: "not"; readonly value: SupportsCondition; readonly [x: string]: unknown }
	| { readonly type: "and"; readonly value: ReadonlyArray<SupportsCondition>; readonly [x: string]: unknown }
	| { readonly type: "or"; readonly value: ReadonlyArray<SupportsCondition>; readonly [x: string]: unknown }
	| {
			readonly propertyId:
				| { readonly property: "background-color"; readonly [x: string]: unknown }
				| { readonly property: "background-image"; readonly [x: string]: unknown }
				| { readonly property: "background-position-x"; readonly [x: string]: unknown }
				| { readonly property: "background-position-y"; readonly [x: string]: unknown }
				| { readonly property: "background-position"; readonly [x: string]: unknown }
				| { readonly property: "background-size"; readonly [x: string]: unknown }
				| { readonly property: "background-repeat"; readonly [x: string]: unknown }
				| { readonly property: "background-attachment"; readonly [x: string]: unknown }
				| { readonly property: "background-clip"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "background-origin"; readonly [x: string]: unknown }
				| { readonly property: "background"; readonly [x: string]: unknown }
				| { readonly property: "box-shadow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "opacity"; readonly [x: string]: unknown }
				| { readonly property: "color"; readonly [x: string]: unknown }
				| { readonly property: "display"; readonly [x: string]: unknown }
				| { readonly property: "visibility"; readonly [x: string]: unknown }
				| { readonly property: "width"; readonly [x: string]: unknown }
				| { readonly property: "height"; readonly [x: string]: unknown }
				| { readonly property: "min-width"; readonly [x: string]: unknown }
				| { readonly property: "min-height"; readonly [x: string]: unknown }
				| { readonly property: "max-width"; readonly [x: string]: unknown }
				| { readonly property: "max-height"; readonly [x: string]: unknown }
				| { readonly property: "block-size"; readonly [x: string]: unknown }
				| { readonly property: "inline-size"; readonly [x: string]: unknown }
				| { readonly property: "min-block-size"; readonly [x: string]: unknown }
				| { readonly property: "min-inline-size"; readonly [x: string]: unknown }
				| { readonly property: "max-block-size"; readonly [x: string]: unknown }
				| { readonly property: "max-inline-size"; readonly [x: string]: unknown }
				| { readonly property: "box-sizing"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "aspect-ratio"; readonly [x: string]: unknown }
				| { readonly property: "overflow"; readonly [x: string]: unknown }
				| { readonly property: "overflow-x"; readonly [x: string]: unknown }
				| { readonly property: "overflow-y"; readonly [x: string]: unknown }
				| { readonly property: "text-overflow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "position"; readonly [x: string]: unknown }
				| { readonly property: "top"; readonly [x: string]: unknown }
				| { readonly property: "bottom"; readonly [x: string]: unknown }
				| { readonly property: "left"; readonly [x: string]: unknown }
				| { readonly property: "right"; readonly [x: string]: unknown }
				| { readonly property: "inset-block-start"; readonly [x: string]: unknown }
				| { readonly property: "inset-block-end"; readonly [x: string]: unknown }
				| { readonly property: "inset-inline-start"; readonly [x: string]: unknown }
				| { readonly property: "inset-inline-end"; readonly [x: string]: unknown }
				| { readonly property: "inset-block"; readonly [x: string]: unknown }
				| { readonly property: "inset-inline"; readonly [x: string]: unknown }
				| { readonly property: "inset"; readonly [x: string]: unknown }
				| { readonly property: "border-spacing"; readonly [x: string]: unknown }
				| { readonly property: "border-top-color"; readonly [x: string]: unknown }
				| { readonly property: "border-bottom-color"; readonly [x: string]: unknown }
				| { readonly property: "border-left-color"; readonly [x: string]: unknown }
				| { readonly property: "border-right-color"; readonly [x: string]: unknown }
				| { readonly property: "border-block-start-color"; readonly [x: string]: unknown }
				| { readonly property: "border-block-end-color"; readonly [x: string]: unknown }
				| { readonly property: "border-inline-start-color"; readonly [x: string]: unknown }
				| { readonly property: "border-inline-end-color"; readonly [x: string]: unknown }
				| { readonly property: "border-top-style"; readonly [x: string]: unknown }
				| { readonly property: "border-bottom-style"; readonly [x: string]: unknown }
				| { readonly property: "border-left-style"; readonly [x: string]: unknown }
				| { readonly property: "border-right-style"; readonly [x: string]: unknown }
				| { readonly property: "border-block-start-style"; readonly [x: string]: unknown }
				| { readonly property: "border-block-end-style"; readonly [x: string]: unknown }
				| { readonly property: "border-inline-start-style"; readonly [x: string]: unknown }
				| { readonly property: "border-inline-end-style"; readonly [x: string]: unknown }
				| { readonly property: "border-top-width"; readonly [x: string]: unknown }
				| { readonly property: "border-bottom-width"; readonly [x: string]: unknown }
				| { readonly property: "border-left-width"; readonly [x: string]: unknown }
				| { readonly property: "border-right-width"; readonly [x: string]: unknown }
				| { readonly property: "border-block-start-width"; readonly [x: string]: unknown }
				| { readonly property: "border-block-end-width"; readonly [x: string]: unknown }
				| { readonly property: "border-inline-start-width"; readonly [x: string]: unknown }
				| { readonly property: "border-inline-end-width"; readonly [x: string]: unknown }
				| {
						readonly property: "border-top-left-radius";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "border-top-right-radius";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "border-bottom-left-radius";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "border-bottom-right-radius";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| { readonly property: "border-start-start-radius"; readonly [x: string]: unknown }
				| { readonly property: "border-start-end-radius"; readonly [x: string]: unknown }
				| { readonly property: "border-end-start-radius"; readonly [x: string]: unknown }
				| { readonly property: "border-end-end-radius"; readonly [x: string]: unknown }
				| { readonly property: "border-radius"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "border-image-source"; readonly [x: string]: unknown }
				| { readonly property: "border-image-outset"; readonly [x: string]: unknown }
				| { readonly property: "border-image-repeat"; readonly [x: string]: unknown }
				| { readonly property: "border-image-width"; readonly [x: string]: unknown }
				| { readonly property: "border-image-slice"; readonly [x: string]: unknown }
				| { readonly property: "border-image"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "border-color"; readonly [x: string]: unknown }
				| { readonly property: "border-style"; readonly [x: string]: unknown }
				| { readonly property: "border-width"; readonly [x: string]: unknown }
				| { readonly property: "border-block-color"; readonly [x: string]: unknown }
				| { readonly property: "border-block-style"; readonly [x: string]: unknown }
				| { readonly property: "border-block-width"; readonly [x: string]: unknown }
				| { readonly property: "border-inline-color"; readonly [x: string]: unknown }
				| { readonly property: "border-inline-style"; readonly [x: string]: unknown }
				| { readonly property: "border-inline-width"; readonly [x: string]: unknown }
				| { readonly property: "border"; readonly [x: string]: unknown }
				| { readonly property: "border-top"; readonly [x: string]: unknown }
				| { readonly property: "border-bottom"; readonly [x: string]: unknown }
				| { readonly property: "border-left"; readonly [x: string]: unknown }
				| { readonly property: "border-right"; readonly [x: string]: unknown }
				| { readonly property: "border-block"; readonly [x: string]: unknown }
				| { readonly property: "border-block-start"; readonly [x: string]: unknown }
				| { readonly property: "border-block-end"; readonly [x: string]: unknown }
				| { readonly property: "border-inline"; readonly [x: string]: unknown }
				| { readonly property: "border-inline-start"; readonly [x: string]: unknown }
				| { readonly property: "border-inline-end"; readonly [x: string]: unknown }
				| { readonly property: "outline"; readonly [x: string]: unknown }
				| { readonly property: "outline-color"; readonly [x: string]: unknown }
				| { readonly property: "outline-style"; readonly [x: string]: unknown }
				| { readonly property: "outline-width"; readonly [x: string]: unknown }
				| { readonly property: "flex-direction"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "flex-wrap"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "flex-flow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "flex-grow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "flex-shrink"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "flex-basis"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "flex"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "order"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "align-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "justify-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "place-content"; readonly [x: string]: unknown }
				| { readonly property: "align-self"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "justify-self"; readonly [x: string]: unknown }
				| { readonly property: "place-self"; readonly [x: string]: unknown }
				| { readonly property: "align-items"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "justify-items"; readonly [x: string]: unknown }
				| { readonly property: "place-items"; readonly [x: string]: unknown }
				| { readonly property: "row-gap"; readonly [x: string]: unknown }
				| { readonly property: "column-gap"; readonly [x: string]: unknown }
				| { readonly property: "gap"; readonly [x: string]: unknown }
				| { readonly property: "box-orient"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "box-direction"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "box-ordinal-group"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "box-align"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "box-flex"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "box-flex-group"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "box-pack"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "box-lines"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "flex-pack"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "flex-order"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "flex-align"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "flex-item-align"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "flex-line-pack"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "flex-positive"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "flex-negative"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| {
						readonly property: "flex-preferred-size";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| { readonly property: "grid-template-columns"; readonly [x: string]: unknown }
				| { readonly property: "grid-template-rows"; readonly [x: string]: unknown }
				| { readonly property: "grid-auto-columns"; readonly [x: string]: unknown }
				| { readonly property: "grid-auto-rows"; readonly [x: string]: unknown }
				| { readonly property: "grid-auto-flow"; readonly [x: string]: unknown }
				| { readonly property: "grid-template-areas"; readonly [x: string]: unknown }
				| { readonly property: "grid-template"; readonly [x: string]: unknown }
				| { readonly property: "grid"; readonly [x: string]: unknown }
				| { readonly property: "grid-row-start"; readonly [x: string]: unknown }
				| { readonly property: "grid-row-end"; readonly [x: string]: unknown }
				| { readonly property: "grid-column-start"; readonly [x: string]: unknown }
				| { readonly property: "grid-column-end"; readonly [x: string]: unknown }
				| { readonly property: "grid-row"; readonly [x: string]: unknown }
				| { readonly property: "grid-column"; readonly [x: string]: unknown }
				| { readonly property: "grid-area"; readonly [x: string]: unknown }
				| { readonly property: "margin-top"; readonly [x: string]: unknown }
				| { readonly property: "margin-bottom"; readonly [x: string]: unknown }
				| { readonly property: "margin-left"; readonly [x: string]: unknown }
				| { readonly property: "margin-right"; readonly [x: string]: unknown }
				| { readonly property: "margin-block-start"; readonly [x: string]: unknown }
				| { readonly property: "margin-block-end"; readonly [x: string]: unknown }
				| { readonly property: "margin-inline-start"; readonly [x: string]: unknown }
				| { readonly property: "margin-inline-end"; readonly [x: string]: unknown }
				| { readonly property: "margin-block"; readonly [x: string]: unknown }
				| { readonly property: "margin-inline"; readonly [x: string]: unknown }
				| { readonly property: "margin"; readonly [x: string]: unknown }
				| { readonly property: "padding-top"; readonly [x: string]: unknown }
				| { readonly property: "padding-bottom"; readonly [x: string]: unknown }
				| { readonly property: "padding-left"; readonly [x: string]: unknown }
				| { readonly property: "padding-right"; readonly [x: string]: unknown }
				| { readonly property: "padding-block-start"; readonly [x: string]: unknown }
				| { readonly property: "padding-block-end"; readonly [x: string]: unknown }
				| { readonly property: "padding-inline-start"; readonly [x: string]: unknown }
				| { readonly property: "padding-inline-end"; readonly [x: string]: unknown }
				| { readonly property: "padding-block"; readonly [x: string]: unknown }
				| { readonly property: "padding-inline"; readonly [x: string]: unknown }
				| { readonly property: "padding"; readonly [x: string]: unknown }
				| { readonly property: "scroll-margin-top"; readonly [x: string]: unknown }
				| { readonly property: "scroll-margin-bottom"; readonly [x: string]: unknown }
				| { readonly property: "scroll-margin-left"; readonly [x: string]: unknown }
				| { readonly property: "scroll-margin-right"; readonly [x: string]: unknown }
				| { readonly property: "scroll-margin-block-start"; readonly [x: string]: unknown }
				| { readonly property: "scroll-margin-block-end"; readonly [x: string]: unknown }
				| { readonly property: "scroll-margin-inline-start"; readonly [x: string]: unknown }
				| { readonly property: "scroll-margin-inline-end"; readonly [x: string]: unknown }
				| { readonly property: "scroll-margin-block"; readonly [x: string]: unknown }
				| { readonly property: "scroll-margin-inline"; readonly [x: string]: unknown }
				| { readonly property: "scroll-margin"; readonly [x: string]: unknown }
				| { readonly property: "scroll-padding-top"; readonly [x: string]: unknown }
				| { readonly property: "scroll-padding-bottom"; readonly [x: string]: unknown }
				| { readonly property: "scroll-padding-left"; readonly [x: string]: unknown }
				| { readonly property: "scroll-padding-right"; readonly [x: string]: unknown }
				| { readonly property: "scroll-padding-block-start"; readonly [x: string]: unknown }
				| { readonly property: "scroll-padding-block-end"; readonly [x: string]: unknown }
				| { readonly property: "scroll-padding-inline-start"; readonly [x: string]: unknown }
				| { readonly property: "scroll-padding-inline-end"; readonly [x: string]: unknown }
				| { readonly property: "scroll-padding-block"; readonly [x: string]: unknown }
				| { readonly property: "scroll-padding-inline"; readonly [x: string]: unknown }
				| { readonly property: "scroll-padding"; readonly [x: string]: unknown }
				| { readonly property: "font-weight"; readonly [x: string]: unknown }
				| { readonly property: "font-size"; readonly [x: string]: unknown }
				| { readonly property: "font-stretch"; readonly [x: string]: unknown }
				| { readonly property: "font-family"; readonly [x: string]: unknown }
				| { readonly property: "font-style"; readonly [x: string]: unknown }
				| { readonly property: "font-variant-caps"; readonly [x: string]: unknown }
				| { readonly property: "line-height"; readonly [x: string]: unknown }
				| { readonly property: "font"; readonly [x: string]: unknown }
				| { readonly property: "vertical-align"; readonly [x: string]: unknown }
				| { readonly property: "font-palette"; readonly [x: string]: unknown }
				| {
						readonly property: "transition-property";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "transition-duration";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| { readonly property: "transition-delay"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| {
						readonly property: "transition-timing-function";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| { readonly property: "transition"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "animation-name"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| {
						readonly property: "animation-duration";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "animation-timing-function";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "animation-iteration-count";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "animation-direction";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "animation-play-state";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| { readonly property: "animation-delay"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| {
						readonly property: "animation-fill-mode";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| { readonly property: "animation-composition"; readonly [x: string]: unknown }
				| { readonly property: "animation-timeline"; readonly [x: string]: unknown }
				| { readonly property: "animation-range-start"; readonly [x: string]: unknown }
				| { readonly property: "animation-range-end"; readonly [x: string]: unknown }
				| { readonly property: "animation-range"; readonly [x: string]: unknown }
				| { readonly property: "animation"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "transform"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "transform-origin"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "transform-style"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "transform-box"; readonly [x: string]: unknown }
				| {
						readonly property: "backface-visibility";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| { readonly property: "perspective"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| {
						readonly property: "perspective-origin";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| { readonly property: "translate"; readonly [x: string]: unknown }
				| { readonly property: "rotate"; readonly [x: string]: unknown }
				| { readonly property: "scale"; readonly [x: string]: unknown }
				| { readonly property: "text-transform"; readonly [x: string]: unknown }
				| { readonly property: "white-space"; readonly [x: string]: unknown }
				| { readonly property: "tab-size"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "word-break"; readonly [x: string]: unknown }
				| { readonly property: "line-break"; readonly [x: string]: unknown }
				| { readonly property: "hyphens"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "overflow-wrap"; readonly [x: string]: unknown }
				| { readonly property: "word-wrap"; readonly [x: string]: unknown }
				| { readonly property: "text-align"; readonly [x: string]: unknown }
				| { readonly property: "text-align-last"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "text-justify"; readonly [x: string]: unknown }
				| { readonly property: "word-spacing"; readonly [x: string]: unknown }
				| { readonly property: "letter-spacing"; readonly [x: string]: unknown }
				| { readonly property: "text-indent"; readonly [x: string]: unknown }
				| {
						readonly property: "text-decoration-line";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "text-decoration-style";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "text-decoration-color";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| { readonly property: "text-decoration-thickness"; readonly [x: string]: unknown }
				| { readonly property: "text-decoration"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| {
						readonly property: "text-decoration-skip-ink";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "text-emphasis-style";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "text-emphasis-color";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| { readonly property: "text-emphasis"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| {
						readonly property: "text-emphasis-position";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| { readonly property: "text-shadow"; readonly [x: string]: unknown }
				| { readonly property: "text-size-adjust"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "direction"; readonly [x: string]: unknown }
				| { readonly property: "unicode-bidi"; readonly [x: string]: unknown }
				| {
						readonly property: "box-decoration-break";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| { readonly property: "resize"; readonly [x: string]: unknown }
				| { readonly property: "cursor"; readonly [x: string]: unknown }
				| { readonly property: "caret-color"; readonly [x: string]: unknown }
				| { readonly property: "caret-shape"; readonly [x: string]: unknown }
				| { readonly property: "caret"; readonly [x: string]: unknown }
				| { readonly property: "user-select"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "accent-color"; readonly [x: string]: unknown }
				| { readonly property: "appearance"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "list-style-type"; readonly [x: string]: unknown }
				| { readonly property: "list-style-image"; readonly [x: string]: unknown }
				| { readonly property: "list-style-position"; readonly [x: string]: unknown }
				| { readonly property: "list-style"; readonly [x: string]: unknown }
				| { readonly property: "marker-side"; readonly [x: string]: unknown }
				| { readonly property: "composes"; readonly [x: string]: unknown }
				| { readonly property: "fill"; readonly [x: string]: unknown }
				| { readonly property: "fill-rule"; readonly [x: string]: unknown }
				| { readonly property: "fill-opacity"; readonly [x: string]: unknown }
				| { readonly property: "stroke"; readonly [x: string]: unknown }
				| { readonly property: "stroke-opacity"; readonly [x: string]: unknown }
				| { readonly property: "stroke-width"; readonly [x: string]: unknown }
				| { readonly property: "stroke-linecap"; readonly [x: string]: unknown }
				| { readonly property: "stroke-linejoin"; readonly [x: string]: unknown }
				| { readonly property: "stroke-miterlimit"; readonly [x: string]: unknown }
				| { readonly property: "stroke-dasharray"; readonly [x: string]: unknown }
				| { readonly property: "stroke-dashoffset"; readonly [x: string]: unknown }
				| { readonly property: "marker-start"; readonly [x: string]: unknown }
				| { readonly property: "marker-mid"; readonly [x: string]: unknown }
				| { readonly property: "marker-end"; readonly [x: string]: unknown }
				| { readonly property: "marker"; readonly [x: string]: unknown }
				| { readonly property: "color-interpolation"; readonly [x: string]: unknown }
				| { readonly property: "color-interpolation-filters"; readonly [x: string]: unknown }
				| { readonly property: "color-rendering"; readonly [x: string]: unknown }
				| { readonly property: "shape-rendering"; readonly [x: string]: unknown }
				| { readonly property: "text-rendering"; readonly [x: string]: unknown }
				| { readonly property: "image-rendering"; readonly [x: string]: unknown }
				| { readonly property: "clip-path"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "clip-rule"; readonly [x: string]: unknown }
				| { readonly property: "mask-image"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "mask-mode"; readonly [x: string]: unknown }
				| { readonly property: "mask-repeat"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "mask-position-x"; readonly [x: string]: unknown }
				| { readonly property: "mask-position-y"; readonly [x: string]: unknown }
				| { readonly property: "mask-position"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "mask-clip"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "mask-origin"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "mask-size"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "mask-composite"; readonly [x: string]: unknown }
				| { readonly property: "mask-type"; readonly [x: string]: unknown }
				| { readonly property: "mask"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "mask-border-source"; readonly [x: string]: unknown }
				| { readonly property: "mask-border-mode"; readonly [x: string]: unknown }
				| { readonly property: "mask-border-slice"; readonly [x: string]: unknown }
				| { readonly property: "mask-border-width"; readonly [x: string]: unknown }
				| { readonly property: "mask-border-outset"; readonly [x: string]: unknown }
				| { readonly property: "mask-border-repeat"; readonly [x: string]: unknown }
				| { readonly property: "mask-border"; readonly [x: string]: unknown }
				| { readonly property: "-webkit-mask-composite"; readonly [x: string]: unknown }
				| { readonly property: "mask-source-type"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "mask-box-image"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| {
						readonly property: "mask-box-image-source";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "mask-box-image-slice";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "mask-box-image-width";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "mask-box-image-outset";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| {
						readonly property: "mask-box-image-repeat";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| { readonly property: "filter"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "backdrop-filter"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly property: "mix-blend-mode"; readonly [x: string]: unknown }
				| { readonly property: "z-index"; readonly [x: string]: unknown }
				| { readonly property: "container-type"; readonly [x: string]: unknown }
				| { readonly property: "container-name"; readonly [x: string]: unknown }
				| { readonly property: "container"; readonly [x: string]: unknown }
				| { readonly property: "view-transition-name"; readonly [x: string]: unknown }
				| { readonly property: "view-transition-class"; readonly [x: string]: unknown }
				| { readonly property: "view-transition-group"; readonly [x: string]: unknown }
				| { readonly property: "color-scheme"; readonly [x: string]: unknown }
				| {
						readonly property: "print-color-adjust";
						readonly vendorPrefix: VendorPrefix;
						readonly [x: string]: unknown;
				  }
				| { readonly property: "all"; readonly [x: string]: unknown }
				| { readonly property: string; readonly [x: string]: unknown };
			readonly type: "declaration";
			readonly value: string;
			readonly [x: string]: unknown;
	  }
	| { readonly type: "selector"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "unknown"; readonly value: String; readonly [x: string]: unknown };

export type StyleRule_for_DefaultAtRule = {
	readonly declarations?: {
		readonly declarations?: ReadonlyArray<Declaration>;
		readonly importantDeclarations?: ReadonlyArray<Declaration>;
		readonly [x: string]: unknown;
	};
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly rules?: ReadonlyArray<Rule>;
	readonly selectors: ReadonlyArray<Selector>;
	readonly [x: string]: unknown;
};

export type MediaRule_for_DefaultAtRule = {
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly query: { readonly mediaQueries: ReadonlyArray<MediaQuery>; readonly [x: string]: unknown };
	readonly rules: ReadonlyArray<Rule>;
	readonly [x: string]: unknown;
};

export type AbsoluteFontSize =
	| "xx-small"
	| "x-small"
	| "small"
	| "medium"
	| "large"
	| "x-large"
	| "xx-large"
	| "xxx-large";

export type AbsoluteFontWeight =
	| { readonly type: "weight"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "normal"; readonly [x: string]: unknown }
	| { readonly type: "bold"; readonly [x: string]: unknown };

export type Angle =
	| { readonly type: "deg"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "rad"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "grad"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "turn"; readonly value: number; readonly [x: string]: unknown };

export type AnimationComposition = "replace" | "add" | "accumulate";

export type AnimationDirection = "normal" | "reverse" | "alternate" | "alternate-reverse";

export type AnimationFillMode = "none" | "forwards" | "backwards" | "both";

export type AnimationIterationCount =
	| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "infinite"; readonly [x: string]: unknown };

export type AnimationPlayState = "running" | "paused";

export type Appearance = string;

export type AttrSelectorOperator = "equal" | "includes" | "dash-match" | "prefix" | "substring" | "suffix";

export type BackfaceVisibility = "visible" | "hidden";

export type BackgroundAttachment = "scroll" | "fixed" | "local";

export type BackgroundClip = "border-box" | "padding-box" | "content-box" | "border" | "text";

export type BackgroundOrigin = "border-box" | "padding-box" | "content-box";

export type BackgroundPosition = {
	readonly x:
		| { readonly type: "center"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
		| {
				readonly offset?: DimensionPercentage_for_LengthValue | null;
				readonly side: "left" | "right";
				readonly type: "side";
				readonly [x: string]: unknown;
		  };
	readonly y:
		| { readonly type: "center"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
		| {
				readonly offset?: DimensionPercentage_for_LengthValue | null;
				readonly side: "top" | "bottom";
				readonly type: "side";
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type BackgroundRepeat = {
	readonly x: "repeat" | "space" | "round" | "no-repeat";
	readonly y: "repeat" | "space" | "round" | "no-repeat";
	readonly [x: string]: unknown;
};

export type BackgroundSize =
	| {
			readonly height:
				| { readonly type: "auto"; readonly [x: string]: unknown }
				| {
						readonly type: "length-percentage";
						readonly value: DimensionPercentage_for_LengthValue;
						readonly [x: string]: unknown;
				  };
			readonly type: "explicit";
			readonly width:
				| { readonly type: "auto"; readonly [x: string]: unknown }
				| {
						readonly type: "length-percentage";
						readonly value: DimensionPercentage_for_LengthValue;
						readonly [x: string]: unknown;
				  };
			readonly [x: string]: unknown;
	  }
	| { readonly type: "cover"; readonly [x: string]: unknown }
	| { readonly type: "contain"; readonly [x: string]: unknown };

export type BasePalette =
	| { readonly type: "light"; readonly [x: string]: unknown }
	| { readonly type: "dark"; readonly [x: string]: unknown }
	| { readonly type: "integer"; readonly value: number; readonly [x: string]: unknown };

export type BaselinePosition = "first" | "last";

export type BlendMode =
	| "normal"
	| "multiply"
	| "screen"
	| "overlay"
	| "darken"
	| "lighten"
	| "color-dodge"
	| "color-burn"
	| "hard-light"
	| "soft-light"
	| "difference"
	| "exclusion"
	| "hue"
	| "saturation"
	| "color"
	| "luminosity"
	| "plus-darker"
	| "plus-lighter";

export type BorderBlockColor = {
	readonly end:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly start:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly [x: string]: unknown;
};

export type BorderBlockStyle = {
	readonly end: "none" | "hidden" | "inset" | "groove" | "outset" | "ridge" | "dotted" | "dashed" | "solid" | "double";
	readonly start:
		| "none"
		| "hidden"
		| "inset"
		| "groove"
		| "outset"
		| "ridge"
		| "dotted"
		| "dashed"
		| "solid"
		| "double";
	readonly [x: string]: unknown;
};

export type BorderBlockWidth = {
	readonly end:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly start:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type BorderColor = {
	readonly bottom:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly left:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly right:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly top:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly [x: string]: unknown;
};

export type BorderImageRepeat = {
	readonly horizontal: "stretch" | "repeat" | "round" | "space";
	readonly vertical: "stretch" | "repeat" | "round" | "space";
	readonly [x: string]: unknown;
};

export type BorderImageSideWidth =
	| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
	| {
			readonly type: "length-percentage";
			readonly value: DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  }
	| { readonly type: "auto"; readonly [x: string]: unknown };

export type BorderInlineColor = {
	readonly end:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly start:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly [x: string]: unknown;
};

export type BorderInlineStyle = {
	readonly end: "none" | "hidden" | "inset" | "groove" | "outset" | "ridge" | "dotted" | "dashed" | "solid" | "double";
	readonly start:
		| "none"
		| "hidden"
		| "inset"
		| "groove"
		| "outset"
		| "ridge"
		| "dotted"
		| "dashed"
		| "solid"
		| "double";
	readonly [x: string]: unknown;
};

export type BorderInlineWidth = {
	readonly end:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly start:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type BorderRadius = {
	readonly bottomLeft: readonly [DimensionPercentage_for_LengthValue, DimensionPercentage_for_LengthValue];
	readonly bottomRight: readonly [DimensionPercentage_for_LengthValue, DimensionPercentage_for_LengthValue];
	readonly topLeft: readonly [DimensionPercentage_for_LengthValue, DimensionPercentage_for_LengthValue];
	readonly topRight: readonly [DimensionPercentage_for_LengthValue, DimensionPercentage_for_LengthValue];
	readonly [x: string]: unknown;
};

export type BorderSideWidth =
	| { readonly type: "thin"; readonly [x: string]: unknown }
	| { readonly type: "medium"; readonly [x: string]: unknown }
	| { readonly type: "thick"; readonly [x: string]: unknown }
	| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };

export type BorderStyle = {
	readonly bottom:
		| "none"
		| "hidden"
		| "inset"
		| "groove"
		| "outset"
		| "ridge"
		| "dotted"
		| "dashed"
		| "solid"
		| "double";
	readonly left: "none" | "hidden" | "inset" | "groove" | "outset" | "ridge" | "dotted" | "dashed" | "solid" | "double";
	readonly right:
		| "none"
		| "hidden"
		| "inset"
		| "groove"
		| "outset"
		| "ridge"
		| "dotted"
		| "dashed"
		| "solid"
		| "double";
	readonly top: "none" | "hidden" | "inset" | "groove" | "outset" | "ridge" | "dotted" | "dashed" | "solid" | "double";
	readonly [x: string]: unknown;
};

export type BorderWidth = {
	readonly bottom:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly left:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly right:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly top:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type BoxAlign = "start" | "end" | "center" | "baseline" | "stretch";

export type BoxDecorationBreak = "slice" | "clone";

export type BoxDirection = "normal" | "reverse";

export type BoxLines = "single" | "multiple";

export type BoxOrient = "horizontal" | "vertical" | "inline-axis" | "block-axis";

export type BoxPack = "start" | "end" | "center" | "justify";

export type BoxSizing = "content-box" | "border-box";

export type CSSWideKeyword = "initial" | "inherit" | "unset" | "revert" | "revert-layer";

export type Caret = {
	readonly color:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| { readonly type: "color"; readonly value: CssColor; readonly [x: string]: unknown };
	readonly shape: "auto" | "bar" | "block" | "underscore";
	readonly [x: string]: unknown;
};

export type CaretShape = "auto" | "bar" | "block" | "underscore";

export type Circle2 = {
	readonly position: {
		readonly x:
			| { readonly type: "center"; readonly [x: string]: unknown }
			| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
			| {
					readonly offset?: DimensionPercentage_for_LengthValue | null;
					readonly side: "left" | "right";
					readonly type: "side";
					readonly [x: string]: unknown;
			  };
		readonly y:
			| { readonly type: "center"; readonly [x: string]: unknown }
			| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
			| {
					readonly offset?: DimensionPercentage_for_LengthValue | null;
					readonly side: "top" | "bottom";
					readonly type: "side";
					readonly [x: string]: unknown;
			  };
		readonly [x: string]: unknown;
	};
	readonly radius:
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  }
		| { readonly type: "closest-side"; readonly [x: string]: unknown }
		| { readonly type: "farthest-side"; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type ColorInterpolation = "auto" | "srgb" | "linearrgb";

export type ColorOrAuto =
	| { readonly type: "auto"; readonly [x: string]: unknown }
	| { readonly type: "color"; readonly value: CssColor; readonly [x: string]: unknown };

export type ColorRendering = "auto" | "optimizespeed" | "optimizequality";

export type ColorScheme = {
	readonly dark: boolean;
	readonly light: boolean;
	readonly only: boolean;
	readonly [x: string]: unknown;
};

export type Combinator =
	| "child"
	| "descendant"
	| "next-sibling"
	| "later-sibling"
	| "pseudo-element"
	| "slot-assignment"
	| "part"
	| "deep-descendant"
	| "deep";

export type ContainerType = "normal" | "inline-size" | "size" | "scroll-state";

export type ContentDistribution = "space-between" | "space-around" | "space-evenly" | "stretch";

export type CursorImage = {
	readonly hotspot?: ReadonlyArray<unknown> | null;
	readonly url: {
		readonly loc: { readonly column: number; readonly line: number; readonly [x: string]: unknown };
		readonly url: string;
		readonly [x: string]: unknown;
	};
	readonly [x: string]: unknown;
};

export type CustomProperty = {
	readonly name: string;
	readonly value: ReadonlyArray<TokenOrValue>;
	readonly [x: string]: unknown;
};

export type DefaultAtRule = null;

export type Direction2 = "ltr" | "rtl";

export type DisplayKeyword =
	| "none"
	| "contents"
	| "table-row-group"
	| "table-header-group"
	| "table-footer-group"
	| "table-row"
	| "table-cell"
	| "table-column-group"
	| "table-column"
	| "table-caption"
	| "ruby-base"
	| "ruby-text"
	| "ruby-base-container"
	| "ruby-text-container";

export type EasingFunction =
	| { readonly type: "linear"; readonly [x: string]: unknown }
	| { readonly type: "ease"; readonly [x: string]: unknown }
	| { readonly type: "ease-in"; readonly [x: string]: unknown }
	| { readonly type: "ease-out"; readonly [x: string]: unknown }
	| { readonly type: "ease-in-out"; readonly [x: string]: unknown }
	| {
			readonly type: "cubic-bezier";
			readonly x1: number;
			readonly x2: number;
			readonly y1: number;
			readonly y2: number;
			readonly [x: string]: unknown;
	  }
	| {
			readonly count: number;
			readonly position?:
				| { readonly type: "start"; readonly [x: string]: unknown }
				| { readonly type: "end"; readonly [x: string]: unknown }
				| { readonly type: "jump-none"; readonly [x: string]: unknown }
				| { readonly type: "jump-both"; readonly [x: string]: unknown };
			readonly type: "steps";
			readonly [x: string]: unknown;
	  };

export type Ellipse2 = {
	readonly position: {
		readonly x:
			| { readonly type: "center"; readonly [x: string]: unknown }
			| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
			| {
					readonly offset?: DimensionPercentage_for_LengthValue | null;
					readonly side: "left" | "right";
					readonly type: "side";
					readonly [x: string]: unknown;
			  };
		readonly y:
			| { readonly type: "center"; readonly [x: string]: unknown }
			| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
			| {
					readonly offset?: DimensionPercentage_for_LengthValue | null;
					readonly side: "top" | "bottom";
					readonly type: "side";
					readonly [x: string]: unknown;
			  };
		readonly [x: string]: unknown;
	};
	readonly radiusX:
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  }
		| { readonly type: "closest-side"; readonly [x: string]: unknown }
		| { readonly type: "farthest-side"; readonly [x: string]: unknown };
	readonly radiusY:
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  }
		| { readonly type: "closest-side"; readonly [x: string]: unknown }
		| { readonly type: "farthest-side"; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type ExclusiveTextDecorationLine = "none" | "spelling-error" | "grammar-error";

export type FillRule = "nonzero" | "evenodd";

export type Flex = {
	readonly basis:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly grow: number;
	readonly shrink: number;
	readonly [x: string]: unknown;
};

export type FlexDirection = "row" | "row-reverse" | "column" | "column-reverse";

export type FlexFlow = {
	readonly direction: "row" | "row-reverse" | "column" | "column-reverse";
	readonly wrap: "nowrap" | "wrap" | "wrap-reverse";
	readonly [x: string]: unknown;
};

export type FlexItemAlign = "auto" | "start" | "end" | "center" | "baseline" | "stretch";

export type FlexLinePack = "start" | "end" | "center" | "justify" | "distribute" | "stretch";

export type FlexPack = "start" | "end" | "center" | "justify" | "distribute";

export type FlexWrap = "nowrap" | "wrap" | "wrap-reverse";

export type FontFamily =
	| "serif"
	| "sans-serif"
	| "cursive"
	| "fantasy"
	| "monospace"
	| "system-ui"
	| "emoji"
	| "math"
	| "fangsong"
	| "ui-serif"
	| "ui-sans-serif"
	| "ui-monospace"
	| "ui-rounded"
	| "initial"
	| "inherit"
	| "unset"
	| "default"
	| "revert"
	| "revert-layer"
	| string;

export type FontFeatureSubrule = {
	readonly declarations: { readonly [x: string]: ReadonlyArray<number> };
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly name:
		| "stylistic"
		| "historical-forms"
		| "styleset"
		| "character-variant"
		| "swash"
		| "ornaments"
		| "annotation";
	readonly [x: string]: unknown;
};

export type FontStretchKeyword =
	| "normal"
	| "ultra-condensed"
	| "extra-condensed"
	| "condensed"
	| "semi-condensed"
	| "semi-expanded"
	| "expanded"
	| "extra-expanded"
	| "ultra-expanded";

export type FontTechnology =
	| "features-opentype"
	| "features-aat"
	| "features-graphite"
	| "color-colrv0"
	| "color-colrv1"
	| "color-svg"
	| "color-sbix"
	| "color-cbdt"
	| "variations"
	| "palettes"
	| "incremental";

export type FontVariantCaps =
	| "normal"
	| "small-caps"
	| "all-small-caps"
	| "petite-caps"
	| "all-petite-caps"
	| "unicase"
	| "titling-caps";

export type Gap = {
	readonly column:
		| { readonly type: "normal"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly row:
		| { readonly type: "normal"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type GapValue =
	| { readonly type: "normal"; readonly [x: string]: unknown }
	| {
			readonly type: "length-percentage";
			readonly value: DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  };

export type GenericBorder_for_LineStyle_and_0 = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly style:
		| "none"
		| "hidden"
		| "inset"
		| "groove"
		| "outset"
		| "ridge"
		| "dotted"
		| "dashed"
		| "solid"
		| "double";
	readonly width:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type GenericBorder_for_LineStyle_and_1 = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly style:
		| "none"
		| "hidden"
		| "inset"
		| "groove"
		| "outset"
		| "ridge"
		| "dotted"
		| "dashed"
		| "solid"
		| "double";
	readonly width:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type GenericBorder_for_LineStyle_and_10 = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly style:
		| "none"
		| "hidden"
		| "inset"
		| "groove"
		| "outset"
		| "ridge"
		| "dotted"
		| "dashed"
		| "solid"
		| "double";
	readonly width:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type GenericBorder_for_LineStyle_and_2 = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly style:
		| "none"
		| "hidden"
		| "inset"
		| "groove"
		| "outset"
		| "ridge"
		| "dotted"
		| "dashed"
		| "solid"
		| "double";
	readonly width:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type GenericBorder_for_LineStyle_and_3 = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly style:
		| "none"
		| "hidden"
		| "inset"
		| "groove"
		| "outset"
		| "ridge"
		| "dotted"
		| "dashed"
		| "solid"
		| "double";
	readonly width:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type GenericBorder_for_LineStyle_and_4 = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly style:
		| "none"
		| "hidden"
		| "inset"
		| "groove"
		| "outset"
		| "ridge"
		| "dotted"
		| "dashed"
		| "solid"
		| "double";
	readonly width:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type GenericBorder_for_LineStyle_and_5 = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly style:
		| "none"
		| "hidden"
		| "inset"
		| "groove"
		| "outset"
		| "ridge"
		| "dotted"
		| "dashed"
		| "solid"
		| "double";
	readonly width:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type GenericBorder_for_LineStyle_and_6 = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly style:
		| "none"
		| "hidden"
		| "inset"
		| "groove"
		| "outset"
		| "ridge"
		| "dotted"
		| "dashed"
		| "solid"
		| "double";
	readonly width:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type GenericBorder_for_LineStyle_and_7 = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly style:
		| "none"
		| "hidden"
		| "inset"
		| "groove"
		| "outset"
		| "ridge"
		| "dotted"
		| "dashed"
		| "solid"
		| "double";
	readonly width:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type GenericBorder_for_LineStyle_and_8 = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly style:
		| "none"
		| "hidden"
		| "inset"
		| "groove"
		| "outset"
		| "ridge"
		| "dotted"
		| "dashed"
		| "solid"
		| "double";
	readonly width:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type GenericBorder_for_LineStyle_and_9 = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly style:
		| "none"
		| "hidden"
		| "inset"
		| "groove"
		| "outset"
		| "ridge"
		| "dotted"
		| "dashed"
		| "solid"
		| "double";
	readonly width:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type GeometryBox =
	| "border-box"
	| "padding-box"
	| "content-box"
	| "margin-box"
	| "fill-box"
	| "stroke-box"
	| "view-box";

export type GradientItem_for_DimensionPercentage_for_Angle =
	| {
			readonly color:
				| { readonly type: "currentcolor"; readonly [x: string]: unknown }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "rgb";
						readonly [x: string]: unknown;
				  }
				| {
						readonly a: number;
						readonly alpha: number;
						readonly b: number;
						readonly l: number;
						readonly type: "lab";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly c: number;
						readonly h: number;
						readonly l: number;
						readonly type: "lch";
						readonly [x: string]: unknown;
				  }
				| {
						readonly a: number;
						readonly alpha: number;
						readonly b: number;
						readonly l: number;
						readonly type: "oklab";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly c: number;
						readonly h: number;
						readonly l: number;
						readonly type: "oklch";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "srgb";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "srgb-linear";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "display-p3";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "a98-rgb";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "prophoto-rgb";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "rec2020";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly type: "xyz-d50";
						readonly x: number;
						readonly y: number;
						readonly z: number;
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly type: "xyz-d65";
						readonly x: number;
						readonly y: number;
						readonly z: number;
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "rgb";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly h: number;
						readonly l: number;
						readonly s: number;
						readonly type: "hsl";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly h: number;
						readonly type: "hwb";
						readonly w: number;
						readonly [x: string]: unknown;
				  }
				| {
						readonly dark: CssColor;
						readonly light: CssColor;
						readonly type: "light-dark";
						readonly [x: string]: unknown;
				  }
				| "accentcolor"
				| "accentcolortext"
				| "activetext"
				| "buttonborder"
				| "buttonface"
				| "buttontext"
				| "canvas"
				| "canvastext"
				| "field"
				| "fieldtext"
				| "graytext"
				| "highlight"
				| "highlighttext"
				| "linktext"
				| "mark"
				| "marktext"
				| "selecteditem"
				| "selecteditemtext"
				| "visitedtext"
				| "activeborder"
				| "activecaption"
				| "appworkspace"
				| "background"
				| "buttonhighlight"
				| "buttonshadow"
				| "captiontext"
				| "inactiveborder"
				| "inactivecaption"
				| "inactivecaptiontext"
				| "infobackground"
				| "infotext"
				| "menu"
				| "menutext"
				| "scrollbar"
				| "threeddarkshadow"
				| "threedface"
				| "threedhighlight"
				| "threedlightshadow"
				| "threedshadow"
				| "window"
				| "windowframe"
				| "windowtext";
			readonly position?: DimensionPercentage_for_Angle | null;
			readonly type: "color-stop";
			readonly [x: string]: unknown;
	  }
	| { readonly type: "hint"; readonly value: DimensionPercentage_for_Angle; readonly [x: string]: unknown };

export type GradientItem_for_DimensionPercentage_for_LengthValue =
	| {
			readonly color:
				| { readonly type: "currentcolor"; readonly [x: string]: unknown }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "rgb";
						readonly [x: string]: unknown;
				  }
				| {
						readonly a: number;
						readonly alpha: number;
						readonly b: number;
						readonly l: number;
						readonly type: "lab";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly c: number;
						readonly h: number;
						readonly l: number;
						readonly type: "lch";
						readonly [x: string]: unknown;
				  }
				| {
						readonly a: number;
						readonly alpha: number;
						readonly b: number;
						readonly l: number;
						readonly type: "oklab";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly c: number;
						readonly h: number;
						readonly l: number;
						readonly type: "oklch";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "srgb";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "srgb-linear";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "display-p3";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "a98-rgb";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "prophoto-rgb";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "rec2020";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly type: "xyz-d50";
						readonly x: number;
						readonly y: number;
						readonly z: number;
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly type: "xyz-d65";
						readonly x: number;
						readonly y: number;
						readonly z: number;
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly g: number;
						readonly r: number;
						readonly type: "rgb";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly h: number;
						readonly l: number;
						readonly s: number;
						readonly type: "hsl";
						readonly [x: string]: unknown;
				  }
				| {
						readonly alpha: number;
						readonly b: number;
						readonly h: number;
						readonly type: "hwb";
						readonly w: number;
						readonly [x: string]: unknown;
				  }
				| {
						readonly dark: CssColor;
						readonly light: CssColor;
						readonly type: "light-dark";
						readonly [x: string]: unknown;
				  }
				| "accentcolor"
				| "accentcolortext"
				| "activetext"
				| "buttonborder"
				| "buttonface"
				| "buttontext"
				| "canvas"
				| "canvastext"
				| "field"
				| "fieldtext"
				| "graytext"
				| "highlight"
				| "highlighttext"
				| "linktext"
				| "mark"
				| "marktext"
				| "selecteditem"
				| "selecteditemtext"
				| "visitedtext"
				| "activeborder"
				| "activecaption"
				| "appworkspace"
				| "background"
				| "buttonhighlight"
				| "buttonshadow"
				| "captiontext"
				| "inactiveborder"
				| "inactivecaption"
				| "inactivecaptiontext"
				| "infobackground"
				| "infotext"
				| "menu"
				| "menutext"
				| "scrollbar"
				| "threeddarkshadow"
				| "threedface"
				| "threedhighlight"
				| "threedlightshadow"
				| "threedshadow"
				| "window"
				| "windowframe"
				| "windowtext";
			readonly position?: DimensionPercentage_for_LengthValue | null;
			readonly type: "color-stop";
			readonly [x: string]: unknown;
	  }
	| { readonly type: "hint"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown };

export type GridAutoFlow = {
	readonly dense: boolean;
	readonly direction: "row" | "column";
	readonly [x: string]: unknown;
};

export type GridTemplateAreas =
	| { readonly type: "none"; readonly [x: string]: unknown }
	| {
			readonly areas: ReadonlyArray<string | null>;
			readonly columns: number;
			readonly type: "areas";
			readonly [x: string]: unknown;
	  };

export type HorizontalPositionKeyword = "left" | "right";

export type Hyphens = "none" | "manual" | "auto";

export type ImageRendering = "auto" | "optimizespeed" | "optimizequality";

export type Inset = {
	readonly bottom:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly left:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly right:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly top:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type InsetBlock = {
	readonly blockEnd:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly blockStart:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type InsetInline = {
	readonly inlineEnd:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly inlineStart:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type InsetRect = {
	readonly radius: {
		readonly bottomLeft: readonly [DimensionPercentage_for_LengthValue, DimensionPercentage_for_LengthValue];
		readonly bottomRight: readonly [DimensionPercentage_for_LengthValue, DimensionPercentage_for_LengthValue];
		readonly topLeft: readonly [DimensionPercentage_for_LengthValue, DimensionPercentage_for_LengthValue];
		readonly topRight: readonly [DimensionPercentage_for_LengthValue, DimensionPercentage_for_LengthValue];
		readonly [x: string]: unknown;
	};
	readonly rect: readonly [
		DimensionPercentage_for_LengthValue,
		DimensionPercentage_for_LengthValue,
		DimensionPercentage_for_LengthValue,
		DimensionPercentage_for_LengthValue,
	];
	readonly [x: string]: unknown;
};

export type LegacyJustify = "left" | "right" | "center";

export type LengthOrNumber =
	| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };

export type LengthPercentageOrAuto =
	| { readonly type: "auto"; readonly [x: string]: unknown }
	| {
			readonly type: "length-percentage";
			readonly value: DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  };

export type LengthValue = {
	readonly unit:
		| "px"
		| "in"
		| "cm"
		| "mm"
		| "q"
		| "pt"
		| "pc"
		| "em"
		| "rem"
		| "ex"
		| "rex"
		| "ch"
		| "rch"
		| "cap"
		| "rcap"
		| "ic"
		| "ric"
		| "lh"
		| "rlh"
		| "vw"
		| "lvw"
		| "svw"
		| "dvw"
		| "cqw"
		| "vh"
		| "lvh"
		| "svh"
		| "dvh"
		| "cqh"
		| "vi"
		| "svi"
		| "lvi"
		| "dvi"
		| "cqi"
		| "vb"
		| "svb"
		| "lvb"
		| "dvb"
		| "cqb"
		| "vmin"
		| "svmin"
		| "lvmin"
		| "dvmin"
		| "cqmin"
		| "vmax"
		| "svmax"
		| "lvmax"
		| "dvmax"
		| "cqmax";
	readonly value: number;
	readonly [x: string]: unknown;
};

export type LineBreak = "auto" | "loose" | "normal" | "strict" | "anywhere";

export type LineHeight =
	| { readonly type: "normal"; readonly [x: string]: unknown }
	| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown };

export type LineStyle =
	| "none"
	| "hidden"
	| "inset"
	| "groove"
	| "outset"
	| "ridge"
	| "dotted"
	| "dashed"
	| "solid"
	| "double";

export type ListStylePosition = "inside" | "outside";

export type Margin = {
	readonly bottom:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly left:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly right:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly top:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type MarginBlock = {
	readonly blockEnd:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly blockStart:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type MarginInline = {
	readonly inlineEnd:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly inlineStart:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type MarkerSide = "match-self" | "match-parent";

export type MaskBorderMode = "luminance" | "alpha";

export type MaskComposite = "add" | "subtract" | "intersect" | "exclude";

export type MaskMode = "luminance" | "alpha" | "match-source";

export type MaskType = "luminance" | "alpha";

export type Matrix3d_for_float = {
	readonly m11: number;
	readonly m12: number;
	readonly m13: number;
	readonly m14: number;
	readonly m21: number;
	readonly m22: number;
	readonly m23: number;
	readonly m24: number;
	readonly m31: number;
	readonly m32: number;
	readonly m33: number;
	readonly m34: number;
	readonly m41: number;
	readonly m42: number;
	readonly m43: number;
	readonly m44: number;
	readonly [x: string]: unknown;
};

export type Matrix_for_float = {
	readonly a: number;
	readonly b: number;
	readonly c: number;
	readonly d: number;
	readonly e: number;
	readonly f: number;
	readonly [x: string]: unknown;
};

export type NamespaceConstraint =
	| { readonly type: "any"; readonly [x: string]: unknown }
	| { readonly prefix: string; readonly type: "specific"; readonly url: string; readonly [x: string]: unknown };

export type Navigation = "none" | "auto";

export type NumberOrPercentage =
	| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown };

export type OtherTextDecorationLine = "underline" | "overline" | "line-through" | "blink";

export type Overflow = {
	readonly x: "visible" | "hidden" | "clip" | "scroll" | "auto";
	readonly y: "visible" | "hidden" | "clip" | "scroll" | "auto";
	readonly [x: string]: unknown;
};

export type OverflowKeyword = "visible" | "hidden" | "clip" | "scroll" | "auto";

export type OverflowPosition = "safe" | "unsafe";

export type OverflowWrap = "normal" | "anywhere" | "break-word";

export type OverrideColors = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly index: number;
	readonly [x: string]: unknown;
};

export type Padding = {
	readonly bottom:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly left:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly right:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly top:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type PaddingBlock = {
	readonly blockEnd:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly blockStart:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type PaddingInline = {
	readonly inlineEnd:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly inlineStart:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type PagePseudoClass = "left" | "right" | "first" | "last" | "blank";

export type Perspective =
	| { readonly type: "none"; readonly [x: string]: unknown }
	| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };

export type Position = {
	readonly x:
		| { readonly type: "center"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
		| {
				readonly offset?: DimensionPercentage_for_LengthValue | null;
				readonly side: "left" | "right";
				readonly type: "side";
				readonly [x: string]: unknown;
		  };
	readonly y:
		| { readonly type: "center"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
		| {
				readonly offset?: DimensionPercentage_for_LengthValue | null;
				readonly side: "top" | "bottom";
				readonly type: "side";
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type PositionComponent_for_HorizontalPositionKeyword =
	| { readonly type: "center"; readonly [x: string]: unknown }
	| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
	| {
			readonly offset?: DimensionPercentage_for_LengthValue | null;
			readonly side: "left" | "right";
			readonly type: "side";
			readonly [x: string]: unknown;
	  };

export type PositionComponent_for_VerticalPositionKeyword =
	| { readonly type: "center"; readonly [x: string]: unknown }
	| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
	| {
			readonly offset?: DimensionPercentage_for_LengthValue | null;
			readonly side: "top" | "bottom";
			readonly type: "side";
			readonly [x: string]: unknown;
	  };

export type PredefinedCounterStyle =
	| "decimal"
	| "decimal-leading-zero"
	| "arabic-indic"
	| "armenian"
	| "upper-armenian"
	| "lower-armenian"
	| "bengali"
	| "cambodian"
	| "khmer"
	| "cjk-decimal"
	| "devanagari"
	| "georgian"
	| "gujarati"
	| "gurmukhi"
	| "hebrew"
	| "kannada"
	| "lao"
	| "malayalam"
	| "mongolian"
	| "myanmar"
	| "oriya"
	| "persian"
	| "lower-roman"
	| "upper-roman"
	| "tamil"
	| "telugu"
	| "thai"
	| "tibetan"
	| "lower-alpha"
	| "lower-latin"
	| "upper-alpha"
	| "upper-latin"
	| "lower-greek"
	| "hiragana"
	| "hiragana-iroha"
	| "katakana"
	| "katakana-iroha"
	| "disc"
	| "circle"
	| "square"
	| "disclosure-open"
	| "disclosure-closed"
	| "cjk-earthly-branch"
	| "cjk-heavenly-stem"
	| "japanese-informal"
	| "japanese-formal"
	| "korean-hangul-formal"
	| "korean-hanja-informal"
	| "korean-hanja-formal"
	| "simp-chinese-informal"
	| "simp-chinese-formal"
	| "trad-chinese-informal"
	| "trad-chinese-formal"
	| "ethiopic-numeric";

export type Prefix = "none" | "webkit" | "moz" | "ms" | "o";

export type PrintColorAdjust = "economy" | "exact";

export type Qualifier = "only" | "not";

export type Ratio = readonly [number, number];

export type RelativeFontSize = "smaller" | "larger";

export type Resize = "none" | "both" | "horizontal" | "vertical" | "block" | "inline";

export type Resolution =
	| { readonly type: "dpi"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "dpcm"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "dppx"; readonly value: number; readonly [x: string]: unknown };

export type Rotate =
	| "none"
	| {
			readonly xyz: {
				readonly angle:
					| { readonly type: "deg"; readonly value: number; readonly [x: string]: unknown }
					| { readonly type: "rad"; readonly value: number; readonly [x: string]: unknown }
					| { readonly type: "grad"; readonly value: number; readonly [x: string]: unknown }
					| { readonly type: "turn"; readonly value: number; readonly [x: string]: unknown };
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
			};
	  };

export type RoundingStrategy = "nearest" | "up" | "down" | "to-zero";

export type SVGPaintFallback =
	| { readonly type: "none"; readonly [x: string]: unknown }
	| { readonly type: "color"; readonly value: CssColor; readonly [x: string]: unknown };

export type Scale =
	| "none"
	| {
			readonly xyz: {
				readonly x:
					| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
					| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown };
				readonly y:
					| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
					| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown };
				readonly z:
					| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
					| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown };
				readonly [x: string]: unknown;
			};
	  };

export type ScrollMargin = {
	readonly bottom:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly left:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly right:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly top:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type ScrollMarginBlock = {
	readonly blockEnd:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly blockStart:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type ScrollMarginInline = {
	readonly inlineEnd:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly inlineStart:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type ScrollPadding = {
	readonly bottom:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly left:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly right:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly top:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type ScrollPaddingBlock = {
	readonly blockEnd:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly blockStart:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type ScrollPaddingInline = {
	readonly inlineEnd:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly inlineStart:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type ScrollTimeline = {
	readonly axis: "block" | "inline" | "x" | "y";
	readonly scroller: "root" | "nearest" | "self";
	readonly [x: string]: unknown;
};

export type SelectorList = ReadonlyArray<Selector>;

export type ShapeExtent = "closest-side" | "farthest-side" | "closest-corner" | "farthest-corner";

export type ShapeRendering = "auto" | "optimizespeed" | "crispedges" | "geometricprecision";

export type Size2D_for_DimensionPercentage_for_LengthValue = readonly [
	DimensionPercentage_for_LengthValue,
	DimensionPercentage_for_LengthValue,
];

export type Size2D_for_Length = readonly [Length, Length];

export type Spacing =
	| { readonly type: "normal"; readonly [x: string]: unknown }
	| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };

export type String = string;

export type StrokeDasharray =
	| { readonly type: "none"; readonly [x: string]: unknown }
	| {
			readonly type: "values";
			readonly value: ReadonlyArray<DimensionPercentage_for_LengthValue>;
			readonly [x: string]: unknown;
	  };

export type StrokeLinecap = "butt" | "round" | "square";

export type StrokeLinejoin = "miter" | "miter-clip" | "round" | "bevel" | "arcs";

export type SyntaxComponent = {
	readonly kind:
		| { readonly type: "length"; readonly [x: string]: unknown }
		| { readonly type: "number"; readonly [x: string]: unknown }
		| { readonly type: "percentage"; readonly [x: string]: unknown }
		| { readonly type: "length-percentage"; readonly [x: string]: unknown }
		| { readonly type: "string"; readonly [x: string]: unknown }
		| { readonly type: "color"; readonly [x: string]: unknown }
		| { readonly type: "image"; readonly [x: string]: unknown }
		| { readonly type: "url"; readonly [x: string]: unknown }
		| { readonly type: "integer"; readonly [x: string]: unknown }
		| { readonly type: "angle"; readonly [x: string]: unknown }
		| { readonly type: "time"; readonly [x: string]: unknown }
		| { readonly type: "resolution"; readonly [x: string]: unknown }
		| { readonly type: "transform-function"; readonly [x: string]: unknown }
		| { readonly type: "transform-list"; readonly [x: string]: unknown }
		| { readonly type: "custom-ident"; readonly [x: string]: unknown }
		| { readonly type: "literal"; readonly value: string; readonly [x: string]: unknown };
	readonly multiplier:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| { readonly type: "space"; readonly [x: string]: unknown }
		| { readonly type: "comma"; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type TextAlign = "start" | "end" | "left" | "right" | "center" | "justify" | "match-parent" | "justify-all";

export type TextAlignLast = "auto" | "start" | "end" | "left" | "right" | "center" | "justify" | "match-parent";

export type TextDecorationSkipInk = "auto" | "none" | "all";

export type TextDecorationStyle = "solid" | "double" | "dotted" | "dashed" | "wavy";

export type TextDecorationThickness =
	| { readonly type: "auto"; readonly [x: string]: unknown }
	| { readonly type: "from-font"; readonly [x: string]: unknown }
	| {
			readonly type: "length-percentage";
			readonly value: DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  };

export type TextEmphasisPosition = {
	readonly horizontal: "left" | "right";
	readonly vertical: "over" | "under";
	readonly [x: string]: unknown;
};

export type TextEmphasisShape = "dot" | "circle" | "double-circle" | "triangle" | "sesame";

export type TextJustify = "auto" | "none" | "inter-word" | "inter-character";

export type TextOverflow = "clip" | "ellipsis";

export type TextRendering = "auto" | "optimizespeed" | "optimizelegibility" | "geometricprecision";

export type TextSizeAdjust =
	| { readonly type: "auto"; readonly [x: string]: unknown }
	| { readonly type: "none"; readonly [x: string]: unknown }
	| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown };

export type TextTransform = {
	readonly case: "none" | "uppercase" | "lowercase" | "capitalize";
	readonly fullSizeKana: boolean;
	readonly fullWidth: boolean;
	readonly [x: string]: unknown;
};

export type Time =
	| { readonly type: "seconds"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "milliseconds"; readonly value: number; readonly [x: string]: unknown };

export type TimelineRangePercentage = {
	readonly name: "cover" | "contain" | "entry" | "exit" | "entry-crossing" | "exit-crossing";
	readonly percentage: number;
	readonly [x: string]: unknown;
};

export type TrackBreadth =
	| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
	| { readonly type: "flex"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "min-content"; readonly [x: string]: unknown }
	| { readonly type: "max-content"; readonly [x: string]: unknown }
	| { readonly type: "auto"; readonly [x: string]: unknown };

export type TransformBox = "content-box" | "border-box" | "fill-box" | "stroke-box" | "view-box";

export type TransformStyle = "flat" | "preserve3d";

export type UAEnvironmentVariable =
	| "safe-area-inset-top"
	| "safe-area-inset-right"
	| "safe-area-inset-bottom"
	| "safe-area-inset-left"
	| "viewport-segment-width"
	| "viewport-segment-height"
	| "viewport-segment-top"
	| "viewport-segment-left"
	| "viewport-segment-bottom"
	| "viewport-segment-right";

export type UnicodeBidi = "normal" | "embed" | "isolate" | "bidi-override" | "isolate-override" | "plaintext";

export type UnicodeRange = { readonly end: number; readonly start: number; readonly [x: string]: unknown };

export type UnknownAtRule = {
	readonly block?: ReadonlyArray<unknown> | null;
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly name: string;
	readonly prelude: ReadonlyArray<TokenOrValue>;
	readonly [x: string]: unknown;
};

export type Url = {
	readonly loc: { readonly column: number; readonly line: number; readonly [x: string]: unknown };
	readonly url: string;
	readonly [x: string]: unknown;
};

export type UserSelect = "auto" | "text" | "none" | "contain" | "all";

export type VerticalAlignKeyword =
	| "baseline"
	| "sub"
	| "super"
	| "top"
	| "text-top"
	| "middle"
	| "bottom"
	| "text-bottom";

export type VerticalPositionKeyword = "top" | "bottom";

export type ViewTransitionPartName = string;

export type Visibility = "visible" | "hidden" | "collapse";

export type WebKitColorStop = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly position: number;
	readonly [x: string]: unknown;
};

export type WebKitMaskComposite =
	| "clear"
	| "copy"
	| "source-atop"
	| "destination-over"
	| "destination-in"
	| "destination-out"
	| "destination-atop"
	| "source-over"
	| "source-in"
	| "source-out"
	| "xor";

export type WebKitMaskSourceType = "auto" | "luminance" | "alpha";

export type WebKitScrollbarPseudoClass =
	| "horizontal"
	| "vertical"
	| "decrement"
	| "increment"
	| "start"
	| "end"
	| "double-button"
	| "single-button"
	| "no-button"
	| "corner-present"
	| "window-inactive";

export type WebKitScrollbarPseudoElement =
	| "scrollbar"
	| "button"
	| "track"
	| "track-piece"
	| "thumb"
	| "corner"
	| "resizer";

export type WhiteSpace = "normal" | "pre" | "nowrap" | "pre-wrap" | "break-spaces" | "pre-line";

export type WordBreak = "normal" | "keep-all" | "break-all" | "break-word";

export type ZIndex =
	| { readonly type: "auto"; readonly [x: string]: unknown }
	| { readonly type: "integer"; readonly value: number; readonly [x: string]: unknown };

export type FontWeight =
	| { readonly type: "absolute"; readonly value: AbsoluteFontWeight; readonly [x: string]: unknown }
	| { readonly type: "bolder"; readonly [x: string]: unknown }
	| { readonly type: "lighter"; readonly [x: string]: unknown };

export type FontStyle =
	| { readonly type: "normal"; readonly [x: string]: unknown }
	| { readonly type: "italic"; readonly [x: string]: unknown }
	| { readonly type: "oblique"; readonly value: Angle; readonly [x: string]: unknown };

export type Size2D_for_Angle = readonly [Angle, Angle];

export type AttrOperation = {
	readonly caseSensitivity?:
		| "explicit-case-sensitive"
		| "ascii-case-insensitive"
		| "case-sensitive"
		| "ascii-case-insensitive-if-in-html-element-in-html-document";
	readonly operator: AttrSelectorOperator;
	readonly value: string;
	readonly [x: string]: unknown;
};

export type Rect_for_BorderImageSideWidth = readonly [
	BorderImageSideWidth,
	BorderImageSideWidth,
	BorderImageSideWidth,
	BorderImageSideWidth,
];

export type Cursor = {
	readonly images: ReadonlyArray<CursorImage>;
	readonly keyword:
		| "auto"
		| "default"
		| "none"
		| "context-menu"
		| "help"
		| "pointer"
		| "progress"
		| "wait"
		| "cell"
		| "crosshair"
		| "text"
		| "vertical-text"
		| "alias"
		| "copy"
		| "move"
		| "no-drop"
		| "not-allowed"
		| "grab"
		| "grabbing"
		| "e-resize"
		| "n-resize"
		| "ne-resize"
		| "nw-resize"
		| "s-resize"
		| "se-resize"
		| "sw-resize"
		| "w-resize"
		| "ew-resize"
		| "ns-resize"
		| "nesw-resize"
		| "nwse-resize"
		| "col-resize"
		| "row-resize"
		| "all-scroll"
		| "zoom-in"
		| "zoom-out";
	readonly [x: string]: unknown;
};

export type FontStretch =
	| { readonly type: "keyword"; readonly value: FontStretchKeyword; readonly [x: string]: unknown }
	| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown };

export type MaskClip =
	| { readonly type: "geometry-box"; readonly value: GeometryBox; readonly [x: string]: unknown }
	| { readonly type: "no-clip"; readonly [x: string]: unknown };

export type Rect_for_LengthOrNumber = readonly [LengthOrNumber, LengthOrNumber, LengthOrNumber, LengthOrNumber];

export type ViewTimeline = {
	readonly axis: "block" | "inline" | "x" | "y";
	readonly inset: readonly [LengthPercentageOrAuto, LengthPercentageOrAuto];
	readonly [x: string]: unknown;
};

export type AnimationRange = {
	readonly end:
		| "normal"
		| { readonly lengthpercentage: DimensionPercentage_for_LengthValue }
		| {
				readonly timelinerange: {
					readonly name: "cover" | "contain" | "entry" | "exit" | "entry-crossing" | "exit-crossing";
					readonly offset:
						| { readonly type: "dimension"; readonly value: LengthValue; readonly [x: string]: unknown }
						| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
						| {
								readonly type: "calc";
								readonly value: Calc_for_DimensionPercentage_for_LengthValue;
								readonly [x: string]: unknown;
						  };
					readonly [x: string]: unknown;
				};
		  };
	readonly start:
		| "normal"
		| { readonly lengthpercentage: DimensionPercentage_for_LengthValue }
		| {
				readonly timelinerange: {
					readonly name: "cover" | "contain" | "entry" | "exit" | "entry-crossing" | "exit-crossing";
					readonly offset:
						| { readonly type: "dimension"; readonly value: LengthValue; readonly [x: string]: unknown }
						| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
						| {
								readonly type: "calc";
								readonly value: Calc_for_DimensionPercentage_for_LengthValue;
								readonly [x: string]: unknown;
						  };
					readonly [x: string]: unknown;
				};
		  };
	readonly [x: string]: unknown;
};

export type AnimationRangeEnd =
	| "normal"
	| { readonly lengthpercentage: DimensionPercentage_for_LengthValue }
	| {
			readonly timelinerange: {
				readonly name: "cover" | "contain" | "entry" | "exit" | "entry-crossing" | "exit-crossing";
				readonly offset:
					| { readonly type: "dimension"; readonly value: LengthValue; readonly [x: string]: unknown }
					| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
					| {
							readonly type: "calc";
							readonly value: Calc_for_DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  };
				readonly [x: string]: unknown;
			};
	  };

export type AnimationRangeStart =
	| "normal"
	| { readonly lengthpercentage: DimensionPercentage_for_LengthValue }
	| {
			readonly timelinerange: {
				readonly name: "cover" | "contain" | "entry" | "exit" | "entry-crossing" | "exit-crossing";
				readonly offset:
					| { readonly type: "dimension"; readonly value: LengthValue; readonly [x: string]: unknown }
					| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
					| {
							readonly type: "calc";
							readonly value: Calc_for_DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  };
				readonly [x: string]: unknown;
			};
	  };

export type BoxShadow = {
	readonly blur:
		| { readonly type: "value"; readonly value: LengthValue; readonly [x: string]: unknown }
		| { readonly type: "calc"; readonly value: Calc_for_Length; readonly [x: string]: unknown };
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly inset: boolean;
	readonly spread:
		| { readonly type: "value"; readonly value: LengthValue; readonly [x: string]: unknown }
		| { readonly type: "calc"; readonly value: Calc_for_Length; readonly [x: string]: unknown };
	readonly xOffset:
		| { readonly type: "value"; readonly value: LengthValue; readonly [x: string]: unknown }
		| { readonly type: "calc"; readonly value: Calc_for_Length; readonly [x: string]: unknown };
	readonly yOffset:
		| { readonly type: "value"; readonly value: LengthValue; readonly [x: string]: unknown }
		| { readonly type: "calc"; readonly value: Calc_for_Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type DropShadow = {
	readonly blur:
		| { readonly type: "value"; readonly value: LengthValue; readonly [x: string]: unknown }
		| { readonly type: "calc"; readonly value: Calc_for_Length; readonly [x: string]: unknown };
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly xOffset:
		| { readonly type: "value"; readonly value: LengthValue; readonly [x: string]: unknown }
		| { readonly type: "calc"; readonly value: Calc_for_Length; readonly [x: string]: unknown };
	readonly yOffset:
		| { readonly type: "value"; readonly value: LengthValue; readonly [x: string]: unknown }
		| { readonly type: "calc"; readonly value: Calc_for_Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type Point = {
	readonly x:
		| { readonly type: "dimension"; readonly value: LengthValue; readonly [x: string]: unknown }
		| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
		| {
				readonly type: "calc";
				readonly value: Calc_for_DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly y:
		| { readonly type: "dimension"; readonly value: LengthValue; readonly [x: string]: unknown }
		| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
		| {
				readonly type: "calc";
				readonly value: Calc_for_DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type TextIndent = {
	readonly eachLine: boolean;
	readonly hanging: boolean;
	readonly value:
		| { readonly type: "dimension"; readonly value: LengthValue; readonly [x: string]: unknown }
		| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
		| {
				readonly type: "calc";
				readonly value: Calc_for_DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type TextShadow = {
	readonly blur:
		| { readonly type: "value"; readonly value: LengthValue; readonly [x: string]: unknown }
		| { readonly type: "calc"; readonly value: Calc_for_Length; readonly [x: string]: unknown };
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly spread:
		| { readonly type: "value"; readonly value: LengthValue; readonly [x: string]: unknown }
		| { readonly type: "calc"; readonly value: Calc_for_Length; readonly [x: string]: unknown };
	readonly xOffset:
		| { readonly type: "value"; readonly value: LengthValue; readonly [x: string]: unknown }
		| { readonly type: "calc"; readonly value: Calc_for_Length; readonly [x: string]: unknown };
	readonly yOffset:
		| { readonly type: "value"; readonly value: LengthValue; readonly [x: string]: unknown }
		| { readonly type: "calc"; readonly value: Calc_for_Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type Translate =
	| "none"
	| {
			readonly xyz: {
				readonly x:
					| { readonly type: "dimension"; readonly value: LengthValue; readonly [x: string]: unknown }
					| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
					| {
							readonly type: "calc";
							readonly value: Calc_for_DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  };
				readonly y:
					| { readonly type: "dimension"; readonly value: LengthValue; readonly [x: string]: unknown }
					| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
					| {
							readonly type: "calc";
							readonly value: Calc_for_DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  };
				readonly z:
					| { readonly type: "value"; readonly value: LengthValue; readonly [x: string]: unknown }
					| { readonly type: "calc"; readonly value: Calc_for_Length; readonly [x: string]: unknown };
				readonly [x: string]: unknown;
			};
	  };

export type GenericBorder_for_OutlineStyle_and_11 = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly style:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| { readonly type: "line-style"; readonly value: LineStyle; readonly [x: string]: unknown };
	readonly width:
		| { readonly type: "thin"; readonly [x: string]: unknown }
		| { readonly type: "medium"; readonly [x: string]: unknown }
		| { readonly type: "thick"; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type OutlineStyle =
	| { readonly type: "auto"; readonly [x: string]: unknown }
	| { readonly type: "line-style"; readonly value: LineStyle; readonly [x: string]: unknown };

export type BorderImageSlice = {
	readonly fill: boolean;
	readonly offsets: readonly [NumberOrPercentage, NumberOrPercentage, NumberOrPercentage, NumberOrPercentage];
	readonly [x: string]: unknown;
};

export type Transform =
	| {
			readonly type: "translate";
			readonly value: readonly [DimensionPercentage_for_LengthValue, DimensionPercentage_for_LengthValue];
			readonly [x: string]: unknown;
	  }
	| { readonly type: "translateX"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
	| { readonly type: "translateY"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
	| { readonly type: "translateZ"; readonly value: Length; readonly [x: string]: unknown }
	| {
			readonly type: "translate3d";
			readonly value: readonly [DimensionPercentage_for_LengthValue, DimensionPercentage_for_LengthValue, Length];
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "scale";
			readonly value: readonly [NumberOrPercentage, NumberOrPercentage];
			readonly [x: string]: unknown;
	  }
	| { readonly type: "scaleX"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
	| { readonly type: "scaleY"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
	| { readonly type: "scaleZ"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
	| {
			readonly type: "scale3d";
			readonly value: readonly [NumberOrPercentage, NumberOrPercentage, NumberOrPercentage];
			readonly [x: string]: unknown;
	  }
	| { readonly type: "rotate"; readonly value: Angle; readonly [x: string]: unknown }
	| { readonly type: "rotateX"; readonly value: Angle; readonly [x: string]: unknown }
	| { readonly type: "rotateY"; readonly value: Angle; readonly [x: string]: unknown }
	| { readonly type: "rotateZ"; readonly value: Angle; readonly [x: string]: unknown }
	| {
			readonly type: "rotate3d";
			readonly value: readonly [number, number, number, Angle];
			readonly [x: string]: unknown;
	  }
	| { readonly type: "skew"; readonly value: readonly [Angle, Angle]; readonly [x: string]: unknown }
	| { readonly type: "skewX"; readonly value: Angle; readonly [x: string]: unknown }
	| { readonly type: "skewY"; readonly value: Angle; readonly [x: string]: unknown }
	| { readonly type: "perspective"; readonly value: Length; readonly [x: string]: unknown }
	| { readonly type: "matrix"; readonly value: Matrix_for_float; readonly [x: string]: unknown }
	| { readonly type: "matrix3d"; readonly value: Matrix3d_for_float; readonly [x: string]: unknown };

export type TextDecoration = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly line: ExclusiveTextDecorationLine | ReadonlyArray<OtherTextDecorationLine>;
	readonly style: "solid" | "double" | "dotted" | "dashed" | "wavy";
	readonly thickness:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| { readonly type: "from-font"; readonly [x: string]: unknown }
		| {
				readonly type: "length-percentage";
				readonly value: DimensionPercentage_for_LengthValue;
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type TextDecorationLine = ExclusiveTextDecorationLine | ReadonlyArray<OtherTextDecorationLine>;

export type AlignContent =
	| { readonly type: "normal"; readonly [x: string]: unknown }
	| { readonly type: "baseline-position"; readonly value: BaselinePosition; readonly [x: string]: unknown }
	| { readonly type: "content-distribution"; readonly value: ContentDistribution; readonly [x: string]: unknown }
	| {
			readonly overflow?: OverflowPosition | null;
			readonly type: "content-position";
			readonly value: "center" | "start" | "end" | "flex-start" | "flex-end";
			readonly [x: string]: unknown;
	  };

export type AlignItems =
	| { readonly type: "normal"; readonly [x: string]: unknown }
	| { readonly type: "stretch"; readonly [x: string]: unknown }
	| { readonly type: "baseline-position"; readonly value: BaselinePosition; readonly [x: string]: unknown }
	| {
			readonly overflow?: OverflowPosition | null;
			readonly type: "self-position";
			readonly value: "center" | "start" | "end" | "self-start" | "self-end" | "flex-start" | "flex-end";
			readonly [x: string]: unknown;
	  };

export type AlignSelf =
	| { readonly type: "auto"; readonly [x: string]: unknown }
	| { readonly type: "normal"; readonly [x: string]: unknown }
	| { readonly type: "stretch"; readonly [x: string]: unknown }
	| { readonly type: "baseline-position"; readonly value: BaselinePosition; readonly [x: string]: unknown }
	| {
			readonly overflow?: OverflowPosition | null;
			readonly type: "self-position";
			readonly value: "center" | "start" | "end" | "self-start" | "self-end" | "flex-start" | "flex-end";
			readonly [x: string]: unknown;
	  };

export type JustifyContent =
	| { readonly type: "normal"; readonly [x: string]: unknown }
	| { readonly type: "content-distribution"; readonly value: ContentDistribution; readonly [x: string]: unknown }
	| {
			readonly overflow?: OverflowPosition | null;
			readonly type: "content-position";
			readonly value: "center" | "start" | "end" | "flex-start" | "flex-end";
			readonly [x: string]: unknown;
	  }
	| { readonly overflow?: OverflowPosition | null; readonly type: "left"; readonly [x: string]: unknown }
	| { readonly overflow?: OverflowPosition | null; readonly type: "right"; readonly [x: string]: unknown };

export type JustifyItems =
	| { readonly type: "normal"; readonly [x: string]: unknown }
	| { readonly type: "stretch"; readonly [x: string]: unknown }
	| { readonly type: "baseline-position"; readonly value: BaselinePosition; readonly [x: string]: unknown }
	| {
			readonly overflow?: OverflowPosition | null;
			readonly type: "self-position";
			readonly value: "center" | "start" | "end" | "self-start" | "self-end" | "flex-start" | "flex-end";
			readonly [x: string]: unknown;
	  }
	| { readonly overflow?: OverflowPosition | null; readonly type: "left"; readonly [x: string]: unknown }
	| { readonly overflow?: OverflowPosition | null; readonly type: "right"; readonly [x: string]: unknown }
	| { readonly type: "legacy"; readonly value: LegacyJustify; readonly [x: string]: unknown };

export type JustifySelf =
	| { readonly type: "auto"; readonly [x: string]: unknown }
	| { readonly type: "normal"; readonly [x: string]: unknown }
	| { readonly type: "stretch"; readonly [x: string]: unknown }
	| { readonly type: "baseline-position"; readonly value: BaselinePosition; readonly [x: string]: unknown }
	| {
			readonly overflow?: OverflowPosition | null;
			readonly type: "self-position";
			readonly value: "center" | "start" | "end" | "self-start" | "self-end" | "flex-start" | "flex-end";
			readonly [x: string]: unknown;
	  }
	| { readonly overflow?: OverflowPosition | null; readonly type: "left"; readonly [x: string]: unknown }
	| { readonly overflow?: OverflowPosition | null; readonly type: "right"; readonly [x: string]: unknown };

export type PlaceContent = {
	readonly align:
		| { readonly type: "normal"; readonly [x: string]: unknown }
		| { readonly type: "baseline-position"; readonly value: BaselinePosition; readonly [x: string]: unknown }
		| { readonly type: "content-distribution"; readonly value: ContentDistribution; readonly [x: string]: unknown }
		| {
				readonly overflow?: OverflowPosition | null;
				readonly type: "content-position";
				readonly value: "center" | "start" | "end" | "flex-start" | "flex-end";
				readonly [x: string]: unknown;
		  };
	readonly justify:
		| { readonly type: "normal"; readonly [x: string]: unknown }
		| { readonly type: "content-distribution"; readonly value: ContentDistribution; readonly [x: string]: unknown }
		| {
				readonly overflow?: OverflowPosition | null;
				readonly type: "content-position";
				readonly value: "center" | "start" | "end" | "flex-start" | "flex-end";
				readonly [x: string]: unknown;
		  }
		| { readonly overflow?: OverflowPosition | null; readonly type: "left"; readonly [x: string]: unknown }
		| { readonly overflow?: OverflowPosition | null; readonly type: "right"; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type PlaceItems = {
	readonly align:
		| { readonly type: "normal"; readonly [x: string]: unknown }
		| { readonly type: "stretch"; readonly [x: string]: unknown }
		| { readonly type: "baseline-position"; readonly value: BaselinePosition; readonly [x: string]: unknown }
		| {
				readonly overflow?: OverflowPosition | null;
				readonly type: "self-position";
				readonly value: "center" | "start" | "end" | "self-start" | "self-end" | "flex-start" | "flex-end";
				readonly [x: string]: unknown;
		  };
	readonly justify:
		| { readonly type: "normal"; readonly [x: string]: unknown }
		| { readonly type: "stretch"; readonly [x: string]: unknown }
		| { readonly type: "baseline-position"; readonly value: BaselinePosition; readonly [x: string]: unknown }
		| {
				readonly overflow?: OverflowPosition | null;
				readonly type: "self-position";
				readonly value: "center" | "start" | "end" | "self-start" | "self-end" | "flex-start" | "flex-end";
				readonly [x: string]: unknown;
		  }
		| { readonly overflow?: OverflowPosition | null; readonly type: "left"; readonly [x: string]: unknown }
		| { readonly overflow?: OverflowPosition | null; readonly type: "right"; readonly [x: string]: unknown }
		| { readonly type: "legacy"; readonly value: LegacyJustify; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type PlaceSelf = {
	readonly align:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| { readonly type: "normal"; readonly [x: string]: unknown }
		| { readonly type: "stretch"; readonly [x: string]: unknown }
		| { readonly type: "baseline-position"; readonly value: BaselinePosition; readonly [x: string]: unknown }
		| {
				readonly overflow?: OverflowPosition | null;
				readonly type: "self-position";
				readonly value: "center" | "start" | "end" | "self-start" | "self-end" | "flex-start" | "flex-end";
				readonly [x: string]: unknown;
		  };
	readonly justify:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| { readonly type: "normal"; readonly [x: string]: unknown }
		| { readonly type: "stretch"; readonly [x: string]: unknown }
		| { readonly type: "baseline-position"; readonly value: BaselinePosition; readonly [x: string]: unknown }
		| {
				readonly overflow?: OverflowPosition | null;
				readonly type: "self-position";
				readonly value: "center" | "start" | "end" | "self-start" | "self-end" | "flex-start" | "flex-end";
				readonly [x: string]: unknown;
		  }
		| { readonly overflow?: OverflowPosition | null; readonly type: "left"; readonly [x: string]: unknown }
		| { readonly overflow?: OverflowPosition | null; readonly type: "right"; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type FontPaletteValuesProperty =
	| { readonly type: "font-family"; readonly value: FontFamily; readonly [x: string]: unknown }
	| { readonly type: "base-palette"; readonly value: BasePalette; readonly [x: string]: unknown }
	| { readonly type: "override-colors"; readonly value: ReadonlyArray<OverrideColors>; readonly [x: string]: unknown }
	| { readonly type: "custom"; readonly value: CustomProperty; readonly [x: string]: unknown };

export type VendorPrefix = ReadonlyArray<Prefix>;

export type MediaQuery = {
	readonly condition?: MediaCondition | null;
	readonly mediaType: string;
	readonly qualifier?: Qualifier | null;
	readonly [x: string]: unknown;
};

export type AspectRatio = { readonly auto: boolean; readonly ratio?: Ratio | null; readonly [x: string]: unknown };

export type Font = {
	readonly family: ReadonlyArray<FontFamily>;
	readonly lineHeight:
		| { readonly type: "normal"; readonly [x: string]: unknown }
		| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
		| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown };
	readonly size:
		| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
		| { readonly type: "absolute"; readonly value: AbsoluteFontSize; readonly [x: string]: unknown }
		| { readonly type: "relative"; readonly value: RelativeFontSize; readonly [x: string]: unknown };
	readonly stretch:
		| { readonly type: "keyword"; readonly value: FontStretchKeyword; readonly [x: string]: unknown }
		| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown };
	readonly style:
		| { readonly type: "normal"; readonly [x: string]: unknown }
		| { readonly type: "italic"; readonly [x: string]: unknown }
		| { readonly type: "oblique"; readonly value: Angle; readonly [x: string]: unknown };
	readonly variantCaps:
		| "normal"
		| "small-caps"
		| "all-small-caps"
		| "petite-caps"
		| "all-petite-caps"
		| "unicase"
		| "titling-caps";
	readonly weight:
		| { readonly type: "absolute"; readonly value: AbsoluteFontWeight; readonly [x: string]: unknown }
		| { readonly type: "bolder"; readonly [x: string]: unknown }
		| { readonly type: "lighter"; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type FontSize =
	| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
	| { readonly type: "absolute"; readonly value: AbsoluteFontSize; readonly [x: string]: unknown }
	| { readonly type: "relative"; readonly value: RelativeFontSize; readonly [x: string]: unknown };

export type SVGPaint =
	| {
			readonly fallback?: SVGPaintFallback | null;
			readonly type: "url";
			readonly url: {
				readonly loc: { readonly column: number; readonly line: number; readonly [x: string]: unknown };
				readonly url: string;
				readonly [x: string]: unknown;
			};
			readonly [x: string]: unknown;
	  }
	| { readonly type: "color"; readonly value: CssColor; readonly [x: string]: unknown }
	| { readonly type: "context-fill"; readonly [x: string]: unknown }
	| { readonly type: "context-stroke"; readonly [x: string]: unknown }
	| { readonly type: "none"; readonly [x: string]: unknown };

export type Circle =
	| { readonly type: "radius"; readonly value: Length; readonly [x: string]: unknown }
	| { readonly type: "extent"; readonly value: ShapeExtent; readonly [x: string]: unknown };

export type Ellipse =
	| {
			readonly type: "size";
			readonly x:
				| { readonly type: "dimension"; readonly value: LengthValue; readonly [x: string]: unknown }
				| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
				| {
						readonly type: "calc";
						readonly value: Calc_for_DimensionPercentage_for_LengthValue;
						readonly [x: string]: unknown;
				  };
			readonly y:
				| { readonly type: "dimension"; readonly value: LengthValue; readonly [x: string]: unknown }
				| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
				| {
						readonly type: "calc";
						readonly value: Calc_for_DimensionPercentage_for_LengthValue;
						readonly [x: string]: unknown;
				  };
			readonly [x: string]: unknown;
	  }
	| { readonly type: "extent"; readonly value: ShapeExtent; readonly [x: string]: unknown };

export type AnimationName =
	| { readonly type: "none"; readonly [x: string]: unknown }
	| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "string"; readonly value: String; readonly [x: string]: unknown };

export type Container = {
	readonly containerType: "normal" | "inline-size" | "size" | "scroll-state";
	readonly name:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| { readonly type: "names"; readonly value: ReadonlyArray<String>; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type ContainerNameList =
	| { readonly type: "none"; readonly [x: string]: unknown }
	| { readonly type: "names"; readonly value: ReadonlyArray<String>; readonly [x: string]: unknown };

export type FontFeatureValuesRule = {
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly name: ReadonlyArray<String>;
	readonly rules: { readonly [x: string]: FontFeatureSubrule };
	readonly [x: string]: unknown;
};

export type FontFormat =
	| { readonly type: "woff"; readonly [x: string]: unknown }
	| { readonly type: "woff2"; readonly [x: string]: unknown }
	| { readonly type: "truetype"; readonly [x: string]: unknown }
	| { readonly type: "opentype"; readonly [x: string]: unknown }
	| { readonly type: "embedded-opentype"; readonly [x: string]: unknown }
	| { readonly type: "collection"; readonly [x: string]: unknown }
	| { readonly type: "svg"; readonly [x: string]: unknown }
	| { readonly type: "string"; readonly value: String; readonly [x: string]: unknown };

export type GridArea = {
	readonly columnEnd:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| { readonly name: string; readonly type: "area"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "line"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "span"; readonly [x: string]: unknown };
	readonly columnStart:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| { readonly name: string; readonly type: "area"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "line"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "span"; readonly [x: string]: unknown };
	readonly rowEnd:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| { readonly name: string; readonly type: "area"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "line"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "span"; readonly [x: string]: unknown };
	readonly rowStart:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| { readonly name: string; readonly type: "area"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "line"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "span"; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type GridColumn = {
	readonly end:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| { readonly name: string; readonly type: "area"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "line"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "span"; readonly [x: string]: unknown };
	readonly start:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| { readonly name: string; readonly type: "area"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "line"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "span"; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type GridLine =
	| { readonly type: "auto"; readonly [x: string]: unknown }
	| { readonly name: string; readonly type: "area"; readonly [x: string]: unknown }
	| { readonly index: number; readonly name?: String | null; readonly type: "line"; readonly [x: string]: unknown }
	| { readonly index: number; readonly name?: String | null; readonly type: "span"; readonly [x: string]: unknown };

export type GridRow = {
	readonly end:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| { readonly name: string; readonly type: "area"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "line"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "span"; readonly [x: string]: unknown };
	readonly start:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| { readonly name: string; readonly type: "area"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "line"; readonly [x: string]: unknown }
		| { readonly index: number; readonly name?: String | null; readonly type: "span"; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type LayerStatementRule = {
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly names: ReadonlyArray<ReadonlyArray<String>>;
	readonly [x: string]: unknown;
};

export type NamespaceRule = {
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly prefix?: String | null;
	readonly url: string;
	readonly [x: string]: unknown;
};

export type NoneOrCustomIdentList = "none" | { readonly idents: ReadonlyArray<String> };

export type PageSelector = {
	readonly name?: String | null;
	readonly pseudoClasses: ReadonlyArray<PagePseudoClass>;
	readonly [x: string]: unknown;
};

export type Specifier =
	| { readonly type: "global"; readonly [x: string]: unknown }
	| { readonly type: "file"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "source-index"; readonly value: number; readonly [x: string]: unknown };

export type Token =
	| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "at-keyword"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "hash"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "id-hash"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "string"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "unquoted-url"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "delim"; readonly value: string; readonly [x: string]: unknown }
	| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "dimension"; readonly unit: string; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "white-space"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "comment"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "colon"; readonly [x: string]: unknown }
	| { readonly type: "semicolon"; readonly [x: string]: unknown }
	| { readonly type: "comma"; readonly [x: string]: unknown }
	| { readonly type: "include-match"; readonly [x: string]: unknown }
	| { readonly type: "dash-match"; readonly [x: string]: unknown }
	| { readonly type: "prefix-match"; readonly [x: string]: unknown }
	| { readonly type: "suffix-match"; readonly [x: string]: unknown }
	| { readonly type: "substring-match"; readonly [x: string]: unknown }
	| { readonly type: "cdo"; readonly [x: string]: unknown }
	| { readonly type: "cdc"; readonly [x: string]: unknown }
	| { readonly type: "function"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "parenthesis-block"; readonly [x: string]: unknown }
	| { readonly type: "square-bracket-block"; readonly [x: string]: unknown }
	| { readonly type: "curly-bracket-block"; readonly [x: string]: unknown }
	| { readonly type: "bad-url"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "bad-string"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "close-parenthesis"; readonly [x: string]: unknown }
	| { readonly type: "close-square-bracket"; readonly [x: string]: unknown }
	| { readonly type: "close-curly-bracket"; readonly [x: string]: unknown };

export type ViewTransitionGroup = "normal" | "contain" | "nearest" | { readonly custom: String };

export type ViewTransitionName = "none" | "auto" | { readonly custom: String };

export type PropertyRule = {
	readonly inherits: boolean;
	readonly initialValue?: ParsedComponent | null;
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly name: string;
	readonly syntax:
		| { readonly type: "components"; readonly value: ReadonlyArray<SyntaxComponent>; readonly [x: string]: unknown }
		| { readonly type: "universal"; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type TextEmphasis = {
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly style:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| {
				readonly fill: "filled" | "open";
				readonly shape?: TextEmphasisShape | null;
				readonly type: "keyword";
				readonly [x: string]: unknown;
		  }
		| { readonly type: "string"; readonly value: String; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type TextEmphasisStyle =
	| { readonly type: "none"; readonly [x: string]: unknown }
	| {
			readonly fill: "filled" | "open";
			readonly shape?: TextEmphasisShape | null;
			readonly type: "keyword";
			readonly [x: string]: unknown;
	  }
	| { readonly type: "string"; readonly value: String; readonly [x: string]: unknown };

export type KeyframeSelector =
	| { readonly type: "percentage"; readonly value: number; readonly [x: string]: unknown }
	| { readonly type: "from"; readonly [x: string]: unknown }
	| { readonly type: "to"; readonly [x: string]: unknown }
	| {
			readonly type: "timeline-range-percentage";
			readonly value: TimelineRangePercentage;
			readonly [x: string]: unknown;
	  };

export type TrackSize =
	| { readonly type: "track-breadth"; readonly value: TrackBreadth; readonly [x: string]: unknown }
	| {
			readonly max:
				| {
						readonly type: "length";
						readonly value: DimensionPercentage_for_LengthValue;
						readonly [x: string]: unknown;
				  }
				| { readonly type: "flex"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "min-content"; readonly [x: string]: unknown }
				| { readonly type: "max-content"; readonly [x: string]: unknown }
				| { readonly type: "auto"; readonly [x: string]: unknown };
			readonly min:
				| {
						readonly type: "length";
						readonly value: DimensionPercentage_for_LengthValue;
						readonly [x: string]: unknown;
				  }
				| { readonly type: "flex"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "min-content"; readonly [x: string]: unknown }
				| { readonly type: "max-content"; readonly [x: string]: unknown }
				| { readonly type: "auto"; readonly [x: string]: unknown };
			readonly type: "min-max";
			readonly [x: string]: unknown;
	  }
	| {
			readonly type: "fit-content";
			readonly value: DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  };

export type Marker =
	| { readonly type: "none"; readonly [x: string]: unknown }
	| { readonly type: "url"; readonly value: Url; readonly [x: string]: unknown };

export type VerticalAlign =
	| { readonly type: "keyword"; readonly value: VerticalAlignKeyword; readonly [x: string]: unknown }
	| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown };

export type Size2D_for_FontWeight = readonly [FontWeight, FontWeight];

export type FontStyle2 =
	| { readonly type: "normal"; readonly [x: string]: unknown }
	| { readonly type: "italic"; readonly [x: string]: unknown }
	| { readonly type: "oblique"; readonly value: Size2D_for_Angle; readonly [x: string]: unknown };

export type Size2D_for_FontStretch = readonly [FontStretch, FontStretch];

export type Animation = {
	readonly delay:
		| { readonly type: "seconds"; readonly value: number; readonly [x: string]: unknown }
		| { readonly type: "milliseconds"; readonly value: number; readonly [x: string]: unknown };
	readonly direction: "normal" | "reverse" | "alternate" | "alternate-reverse";
	readonly duration:
		| { readonly type: "seconds"; readonly value: number; readonly [x: string]: unknown }
		| { readonly type: "milliseconds"; readonly value: number; readonly [x: string]: unknown };
	readonly fillMode: "none" | "forwards" | "backwards" | "both";
	readonly iterationCount:
		| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
		| { readonly type: "infinite"; readonly [x: string]: unknown };
	readonly name:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
		| { readonly type: "string"; readonly value: String; readonly [x: string]: unknown };
	readonly playState: "running" | "paused";
	readonly timeline:
		| { readonly type: "auto"; readonly [x: string]: unknown }
		| { readonly type: "none"; readonly [x: string]: unknown }
		| { readonly type: "dashed-ident"; readonly value: String; readonly [x: string]: unknown }
		| { readonly type: "scroll"; readonly value: ScrollTimeline; readonly [x: string]: unknown }
		| { readonly type: "view"; readonly value: ViewTimeline; readonly [x: string]: unknown };
	readonly timingFunction:
		| { readonly type: "linear"; readonly [x: string]: unknown }
		| { readonly type: "ease"; readonly [x: string]: unknown }
		| { readonly type: "ease-in"; readonly [x: string]: unknown }
		| { readonly type: "ease-out"; readonly [x: string]: unknown }
		| { readonly type: "ease-in-out"; readonly [x: string]: unknown }
		| {
				readonly type: "cubic-bezier";
				readonly x1: number;
				readonly x2: number;
				readonly y1: number;
				readonly y2: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly count: number;
				readonly position?:
					| { readonly type: "start"; readonly [x: string]: unknown }
					| { readonly type: "end"; readonly [x: string]: unknown }
					| { readonly type: "jump-none"; readonly [x: string]: unknown }
					| { readonly type: "jump-both"; readonly [x: string]: unknown };
				readonly type: "steps";
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type AnimationTimeline =
	| { readonly type: "auto"; readonly [x: string]: unknown }
	| { readonly type: "none"; readonly [x: string]: unknown }
	| { readonly type: "dashed-ident"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "scroll"; readonly value: ScrollTimeline; readonly [x: string]: unknown }
	| { readonly type: "view"; readonly value: ViewTimeline; readonly [x: string]: unknown };

export type Filter =
	| { readonly type: "blur"; readonly value: Length; readonly [x: string]: unknown }
	| { readonly type: "brightness"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
	| { readonly type: "contrast"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
	| { readonly type: "grayscale"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
	| { readonly type: "hue-rotate"; readonly value: Angle; readonly [x: string]: unknown }
	| { readonly type: "invert"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
	| { readonly type: "opacity"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
	| { readonly type: "saturate"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
	| { readonly type: "sepia"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
	| { readonly type: "drop-shadow"; readonly value: DropShadow; readonly [x: string]: unknown }
	| { readonly type: "url"; readonly value: Url; readonly [x: string]: unknown };

export type Polygon = {
	readonly fillRule: "nonzero" | "evenodd";
	readonly points: ReadonlyArray<Point>;
	readonly [x: string]: unknown;
};

export type FontPaletteValuesRule = {
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly name: string;
	readonly properties: ReadonlyArray<FontPaletteValuesProperty>;
	readonly [x: string]: unknown;
};

export type Display =
	| { readonly type: "keyword"; readonly value: DisplayKeyword; readonly [x: string]: unknown }
	| {
			readonly inside:
				| { readonly type: "flow"; readonly [x: string]: unknown }
				| { readonly type: "flow-root"; readonly [x: string]: unknown }
				| { readonly type: "table"; readonly [x: string]: unknown }
				| { readonly type: "flex"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly type: "box"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
				| { readonly type: "grid"; readonly [x: string]: unknown }
				| { readonly type: "ruby"; readonly [x: string]: unknown };
			readonly isListItem: boolean;
			readonly outside: "block" | "inline" | "run-in";
			readonly type: "pair";
			readonly [x: string]: unknown;
	  };

export type MaxSize =
	| { readonly type: "none"; readonly [x: string]: unknown }
	| {
			readonly type: "length-percentage";
			readonly value: DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  }
	| { readonly type: "min-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly type: "max-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly type: "fit-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| {
			readonly type: "fit-content-function";
			readonly value: DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  }
	| { readonly type: "stretch"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly type: "contain"; readonly [x: string]: unknown };

export type Position2 =
	| { readonly type: "static"; readonly [x: string]: unknown }
	| { readonly type: "relative"; readonly [x: string]: unknown }
	| { readonly type: "absolute"; readonly [x: string]: unknown }
	| { readonly type: "sticky"; readonly value: VendorPrefix; readonly [x: string]: unknown }
	| { readonly type: "fixed"; readonly [x: string]: unknown };

export type PropertyId =
	| { readonly property: "background-color"; readonly [x: string]: unknown }
	| { readonly property: "background-image"; readonly [x: string]: unknown }
	| { readonly property: "background-position-x"; readonly [x: string]: unknown }
	| { readonly property: "background-position-y"; readonly [x: string]: unknown }
	| { readonly property: "background-position"; readonly [x: string]: unknown }
	| { readonly property: "background-size"; readonly [x: string]: unknown }
	| { readonly property: "background-repeat"; readonly [x: string]: unknown }
	| { readonly property: "background-attachment"; readonly [x: string]: unknown }
	| { readonly property: "background-clip"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "background-origin"; readonly [x: string]: unknown }
	| { readonly property: "background"; readonly [x: string]: unknown }
	| { readonly property: "box-shadow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "opacity"; readonly [x: string]: unknown }
	| { readonly property: "color"; readonly [x: string]: unknown }
	| { readonly property: "display"; readonly [x: string]: unknown }
	| { readonly property: "visibility"; readonly [x: string]: unknown }
	| { readonly property: "width"; readonly [x: string]: unknown }
	| { readonly property: "height"; readonly [x: string]: unknown }
	| { readonly property: "min-width"; readonly [x: string]: unknown }
	| { readonly property: "min-height"; readonly [x: string]: unknown }
	| { readonly property: "max-width"; readonly [x: string]: unknown }
	| { readonly property: "max-height"; readonly [x: string]: unknown }
	| { readonly property: "block-size"; readonly [x: string]: unknown }
	| { readonly property: "inline-size"; readonly [x: string]: unknown }
	| { readonly property: "min-block-size"; readonly [x: string]: unknown }
	| { readonly property: "min-inline-size"; readonly [x: string]: unknown }
	| { readonly property: "max-block-size"; readonly [x: string]: unknown }
	| { readonly property: "max-inline-size"; readonly [x: string]: unknown }
	| { readonly property: "box-sizing"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "aspect-ratio"; readonly [x: string]: unknown }
	| { readonly property: "overflow"; readonly [x: string]: unknown }
	| { readonly property: "overflow-x"; readonly [x: string]: unknown }
	| { readonly property: "overflow-y"; readonly [x: string]: unknown }
	| { readonly property: "text-overflow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "position"; readonly [x: string]: unknown }
	| { readonly property: "top"; readonly [x: string]: unknown }
	| { readonly property: "bottom"; readonly [x: string]: unknown }
	| { readonly property: "left"; readonly [x: string]: unknown }
	| { readonly property: "right"; readonly [x: string]: unknown }
	| { readonly property: "inset-block-start"; readonly [x: string]: unknown }
	| { readonly property: "inset-block-end"; readonly [x: string]: unknown }
	| { readonly property: "inset-inline-start"; readonly [x: string]: unknown }
	| { readonly property: "inset-inline-end"; readonly [x: string]: unknown }
	| { readonly property: "inset-block"; readonly [x: string]: unknown }
	| { readonly property: "inset-inline"; readonly [x: string]: unknown }
	| { readonly property: "inset"; readonly [x: string]: unknown }
	| { readonly property: "border-spacing"; readonly [x: string]: unknown }
	| { readonly property: "border-top-color"; readonly [x: string]: unknown }
	| { readonly property: "border-bottom-color"; readonly [x: string]: unknown }
	| { readonly property: "border-left-color"; readonly [x: string]: unknown }
	| { readonly property: "border-right-color"; readonly [x: string]: unknown }
	| { readonly property: "border-block-start-color"; readonly [x: string]: unknown }
	| { readonly property: "border-block-end-color"; readonly [x: string]: unknown }
	| { readonly property: "border-inline-start-color"; readonly [x: string]: unknown }
	| { readonly property: "border-inline-end-color"; readonly [x: string]: unknown }
	| { readonly property: "border-top-style"; readonly [x: string]: unknown }
	| { readonly property: "border-bottom-style"; readonly [x: string]: unknown }
	| { readonly property: "border-left-style"; readonly [x: string]: unknown }
	| { readonly property: "border-right-style"; readonly [x: string]: unknown }
	| { readonly property: "border-block-start-style"; readonly [x: string]: unknown }
	| { readonly property: "border-block-end-style"; readonly [x: string]: unknown }
	| { readonly property: "border-inline-start-style"; readonly [x: string]: unknown }
	| { readonly property: "border-inline-end-style"; readonly [x: string]: unknown }
	| { readonly property: "border-top-width"; readonly [x: string]: unknown }
	| { readonly property: "border-bottom-width"; readonly [x: string]: unknown }
	| { readonly property: "border-left-width"; readonly [x: string]: unknown }
	| { readonly property: "border-right-width"; readonly [x: string]: unknown }
	| { readonly property: "border-block-start-width"; readonly [x: string]: unknown }
	| { readonly property: "border-block-end-width"; readonly [x: string]: unknown }
	| { readonly property: "border-inline-start-width"; readonly [x: string]: unknown }
	| { readonly property: "border-inline-end-width"; readonly [x: string]: unknown }
	| { readonly property: "border-top-left-radius"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "border-top-right-radius"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| {
			readonly property: "border-bottom-left-radius";
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-bottom-right-radius";
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "border-start-start-radius"; readonly [x: string]: unknown }
	| { readonly property: "border-start-end-radius"; readonly [x: string]: unknown }
	| { readonly property: "border-end-start-radius"; readonly [x: string]: unknown }
	| { readonly property: "border-end-end-radius"; readonly [x: string]: unknown }
	| { readonly property: "border-radius"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "border-image-source"; readonly [x: string]: unknown }
	| { readonly property: "border-image-outset"; readonly [x: string]: unknown }
	| { readonly property: "border-image-repeat"; readonly [x: string]: unknown }
	| { readonly property: "border-image-width"; readonly [x: string]: unknown }
	| { readonly property: "border-image-slice"; readonly [x: string]: unknown }
	| { readonly property: "border-image"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "border-color"; readonly [x: string]: unknown }
	| { readonly property: "border-style"; readonly [x: string]: unknown }
	| { readonly property: "border-width"; readonly [x: string]: unknown }
	| { readonly property: "border-block-color"; readonly [x: string]: unknown }
	| { readonly property: "border-block-style"; readonly [x: string]: unknown }
	| { readonly property: "border-block-width"; readonly [x: string]: unknown }
	| { readonly property: "border-inline-color"; readonly [x: string]: unknown }
	| { readonly property: "border-inline-style"; readonly [x: string]: unknown }
	| { readonly property: "border-inline-width"; readonly [x: string]: unknown }
	| { readonly property: "border"; readonly [x: string]: unknown }
	| { readonly property: "border-top"; readonly [x: string]: unknown }
	| { readonly property: "border-bottom"; readonly [x: string]: unknown }
	| { readonly property: "border-left"; readonly [x: string]: unknown }
	| { readonly property: "border-right"; readonly [x: string]: unknown }
	| { readonly property: "border-block"; readonly [x: string]: unknown }
	| { readonly property: "border-block-start"; readonly [x: string]: unknown }
	| { readonly property: "border-block-end"; readonly [x: string]: unknown }
	| { readonly property: "border-inline"; readonly [x: string]: unknown }
	| { readonly property: "border-inline-start"; readonly [x: string]: unknown }
	| { readonly property: "border-inline-end"; readonly [x: string]: unknown }
	| { readonly property: "outline"; readonly [x: string]: unknown }
	| { readonly property: "outline-color"; readonly [x: string]: unknown }
	| { readonly property: "outline-style"; readonly [x: string]: unknown }
	| { readonly property: "outline-width"; readonly [x: string]: unknown }
	| { readonly property: "flex-direction"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "flex-wrap"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "flex-flow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "flex-grow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "flex-shrink"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "flex-basis"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "flex"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "order"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "align-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "justify-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "place-content"; readonly [x: string]: unknown }
	| { readonly property: "align-self"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "justify-self"; readonly [x: string]: unknown }
	| { readonly property: "place-self"; readonly [x: string]: unknown }
	| { readonly property: "align-items"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "justify-items"; readonly [x: string]: unknown }
	| { readonly property: "place-items"; readonly [x: string]: unknown }
	| { readonly property: "row-gap"; readonly [x: string]: unknown }
	| { readonly property: "column-gap"; readonly [x: string]: unknown }
	| { readonly property: "gap"; readonly [x: string]: unknown }
	| { readonly property: "box-orient"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "box-direction"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "box-ordinal-group"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "box-align"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "box-flex"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "box-flex-group"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "box-pack"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "box-lines"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "flex-pack"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "flex-order"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "flex-align"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "flex-item-align"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "flex-line-pack"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "flex-positive"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "flex-negative"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "flex-preferred-size"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "grid-template-columns"; readonly [x: string]: unknown }
	| { readonly property: "grid-template-rows"; readonly [x: string]: unknown }
	| { readonly property: "grid-auto-columns"; readonly [x: string]: unknown }
	| { readonly property: "grid-auto-rows"; readonly [x: string]: unknown }
	| { readonly property: "grid-auto-flow"; readonly [x: string]: unknown }
	| { readonly property: "grid-template-areas"; readonly [x: string]: unknown }
	| { readonly property: "grid-template"; readonly [x: string]: unknown }
	| { readonly property: "grid"; readonly [x: string]: unknown }
	| { readonly property: "grid-row-start"; readonly [x: string]: unknown }
	| { readonly property: "grid-row-end"; readonly [x: string]: unknown }
	| { readonly property: "grid-column-start"; readonly [x: string]: unknown }
	| { readonly property: "grid-column-end"; readonly [x: string]: unknown }
	| { readonly property: "grid-row"; readonly [x: string]: unknown }
	| { readonly property: "grid-column"; readonly [x: string]: unknown }
	| { readonly property: "grid-area"; readonly [x: string]: unknown }
	| { readonly property: "margin-top"; readonly [x: string]: unknown }
	| { readonly property: "margin-bottom"; readonly [x: string]: unknown }
	| { readonly property: "margin-left"; readonly [x: string]: unknown }
	| { readonly property: "margin-right"; readonly [x: string]: unknown }
	| { readonly property: "margin-block-start"; readonly [x: string]: unknown }
	| { readonly property: "margin-block-end"; readonly [x: string]: unknown }
	| { readonly property: "margin-inline-start"; readonly [x: string]: unknown }
	| { readonly property: "margin-inline-end"; readonly [x: string]: unknown }
	| { readonly property: "margin-block"; readonly [x: string]: unknown }
	| { readonly property: "margin-inline"; readonly [x: string]: unknown }
	| { readonly property: "margin"; readonly [x: string]: unknown }
	| { readonly property: "padding-top"; readonly [x: string]: unknown }
	| { readonly property: "padding-bottom"; readonly [x: string]: unknown }
	| { readonly property: "padding-left"; readonly [x: string]: unknown }
	| { readonly property: "padding-right"; readonly [x: string]: unknown }
	| { readonly property: "padding-block-start"; readonly [x: string]: unknown }
	| { readonly property: "padding-block-end"; readonly [x: string]: unknown }
	| { readonly property: "padding-inline-start"; readonly [x: string]: unknown }
	| { readonly property: "padding-inline-end"; readonly [x: string]: unknown }
	| { readonly property: "padding-block"; readonly [x: string]: unknown }
	| { readonly property: "padding-inline"; readonly [x: string]: unknown }
	| { readonly property: "padding"; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin-top"; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin-bottom"; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin-left"; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin-right"; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin-block-start"; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin-block-end"; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin-inline-start"; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin-inline-end"; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin-block"; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin-inline"; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin"; readonly [x: string]: unknown }
	| { readonly property: "scroll-padding-top"; readonly [x: string]: unknown }
	| { readonly property: "scroll-padding-bottom"; readonly [x: string]: unknown }
	| { readonly property: "scroll-padding-left"; readonly [x: string]: unknown }
	| { readonly property: "scroll-padding-right"; readonly [x: string]: unknown }
	| { readonly property: "scroll-padding-block-start"; readonly [x: string]: unknown }
	| { readonly property: "scroll-padding-block-end"; readonly [x: string]: unknown }
	| { readonly property: "scroll-padding-inline-start"; readonly [x: string]: unknown }
	| { readonly property: "scroll-padding-inline-end"; readonly [x: string]: unknown }
	| { readonly property: "scroll-padding-block"; readonly [x: string]: unknown }
	| { readonly property: "scroll-padding-inline"; readonly [x: string]: unknown }
	| { readonly property: "scroll-padding"; readonly [x: string]: unknown }
	| { readonly property: "font-weight"; readonly [x: string]: unknown }
	| { readonly property: "font-size"; readonly [x: string]: unknown }
	| { readonly property: "font-stretch"; readonly [x: string]: unknown }
	| { readonly property: "font-family"; readonly [x: string]: unknown }
	| { readonly property: "font-style"; readonly [x: string]: unknown }
	| { readonly property: "font-variant-caps"; readonly [x: string]: unknown }
	| { readonly property: "line-height"; readonly [x: string]: unknown }
	| { readonly property: "font"; readonly [x: string]: unknown }
	| { readonly property: "vertical-align"; readonly [x: string]: unknown }
	| { readonly property: "font-palette"; readonly [x: string]: unknown }
	| { readonly property: "transition-property"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "transition-duration"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "transition-delay"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| {
			readonly property: "transition-timing-function";
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "transition"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "animation-name"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "animation-duration"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| {
			readonly property: "animation-timing-function";
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "animation-iteration-count";
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "animation-direction"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "animation-play-state"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "animation-delay"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "animation-fill-mode"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "animation-composition"; readonly [x: string]: unknown }
	| { readonly property: "animation-timeline"; readonly [x: string]: unknown }
	| { readonly property: "animation-range-start"; readonly [x: string]: unknown }
	| { readonly property: "animation-range-end"; readonly [x: string]: unknown }
	| { readonly property: "animation-range"; readonly [x: string]: unknown }
	| { readonly property: "animation"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "transform"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "transform-origin"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "transform-style"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "transform-box"; readonly [x: string]: unknown }
	| { readonly property: "backface-visibility"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "perspective"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "perspective-origin"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "translate"; readonly [x: string]: unknown }
	| { readonly property: "rotate"; readonly [x: string]: unknown }
	| { readonly property: "scale"; readonly [x: string]: unknown }
	| { readonly property: "text-transform"; readonly [x: string]: unknown }
	| { readonly property: "white-space"; readonly [x: string]: unknown }
	| { readonly property: "tab-size"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "word-break"; readonly [x: string]: unknown }
	| { readonly property: "line-break"; readonly [x: string]: unknown }
	| { readonly property: "hyphens"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "overflow-wrap"; readonly [x: string]: unknown }
	| { readonly property: "word-wrap"; readonly [x: string]: unknown }
	| { readonly property: "text-align"; readonly [x: string]: unknown }
	| { readonly property: "text-align-last"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "text-justify"; readonly [x: string]: unknown }
	| { readonly property: "word-spacing"; readonly [x: string]: unknown }
	| { readonly property: "letter-spacing"; readonly [x: string]: unknown }
	| { readonly property: "text-indent"; readonly [x: string]: unknown }
	| { readonly property: "text-decoration-line"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "text-decoration-style"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "text-decoration-color"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "text-decoration-thickness"; readonly [x: string]: unknown }
	| { readonly property: "text-decoration"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| {
			readonly property: "text-decoration-skip-ink";
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "text-emphasis-style"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "text-emphasis-color"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "text-emphasis"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "text-emphasis-position"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "text-shadow"; readonly [x: string]: unknown }
	| { readonly property: "text-size-adjust"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "direction"; readonly [x: string]: unknown }
	| { readonly property: "unicode-bidi"; readonly [x: string]: unknown }
	| { readonly property: "box-decoration-break"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "resize"; readonly [x: string]: unknown }
	| { readonly property: "cursor"; readonly [x: string]: unknown }
	| { readonly property: "caret-color"; readonly [x: string]: unknown }
	| { readonly property: "caret-shape"; readonly [x: string]: unknown }
	| { readonly property: "caret"; readonly [x: string]: unknown }
	| { readonly property: "user-select"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "accent-color"; readonly [x: string]: unknown }
	| { readonly property: "appearance"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "list-style-type"; readonly [x: string]: unknown }
	| { readonly property: "list-style-image"; readonly [x: string]: unknown }
	| { readonly property: "list-style-position"; readonly [x: string]: unknown }
	| { readonly property: "list-style"; readonly [x: string]: unknown }
	| { readonly property: "marker-side"; readonly [x: string]: unknown }
	| { readonly property: "composes"; readonly [x: string]: unknown }
	| { readonly property: "fill"; readonly [x: string]: unknown }
	| { readonly property: "fill-rule"; readonly [x: string]: unknown }
	| { readonly property: "fill-opacity"; readonly [x: string]: unknown }
	| { readonly property: "stroke"; readonly [x: string]: unknown }
	| { readonly property: "stroke-opacity"; readonly [x: string]: unknown }
	| { readonly property: "stroke-width"; readonly [x: string]: unknown }
	| { readonly property: "stroke-linecap"; readonly [x: string]: unknown }
	| { readonly property: "stroke-linejoin"; readonly [x: string]: unknown }
	| { readonly property: "stroke-miterlimit"; readonly [x: string]: unknown }
	| { readonly property: "stroke-dasharray"; readonly [x: string]: unknown }
	| { readonly property: "stroke-dashoffset"; readonly [x: string]: unknown }
	| { readonly property: "marker-start"; readonly [x: string]: unknown }
	| { readonly property: "marker-mid"; readonly [x: string]: unknown }
	| { readonly property: "marker-end"; readonly [x: string]: unknown }
	| { readonly property: "marker"; readonly [x: string]: unknown }
	| { readonly property: "color-interpolation"; readonly [x: string]: unknown }
	| { readonly property: "color-interpolation-filters"; readonly [x: string]: unknown }
	| { readonly property: "color-rendering"; readonly [x: string]: unknown }
	| { readonly property: "shape-rendering"; readonly [x: string]: unknown }
	| { readonly property: "text-rendering"; readonly [x: string]: unknown }
	| { readonly property: "image-rendering"; readonly [x: string]: unknown }
	| { readonly property: "clip-path"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "clip-rule"; readonly [x: string]: unknown }
	| { readonly property: "mask-image"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "mask-mode"; readonly [x: string]: unknown }
	| { readonly property: "mask-repeat"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "mask-position-x"; readonly [x: string]: unknown }
	| { readonly property: "mask-position-y"; readonly [x: string]: unknown }
	| { readonly property: "mask-position"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "mask-clip"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "mask-origin"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "mask-size"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "mask-composite"; readonly [x: string]: unknown }
	| { readonly property: "mask-type"; readonly [x: string]: unknown }
	| { readonly property: "mask"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "mask-border-source"; readonly [x: string]: unknown }
	| { readonly property: "mask-border-mode"; readonly [x: string]: unknown }
	| { readonly property: "mask-border-slice"; readonly [x: string]: unknown }
	| { readonly property: "mask-border-width"; readonly [x: string]: unknown }
	| { readonly property: "mask-border-outset"; readonly [x: string]: unknown }
	| { readonly property: "mask-border-repeat"; readonly [x: string]: unknown }
	| { readonly property: "mask-border"; readonly [x: string]: unknown }
	| { readonly property: "-webkit-mask-composite"; readonly [x: string]: unknown }
	| { readonly property: "mask-source-type"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "mask-box-image"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "mask-box-image-source"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "mask-box-image-slice"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "mask-box-image-width"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "mask-box-image-outset"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "mask-box-image-repeat"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "filter"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "backdrop-filter"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "mix-blend-mode"; readonly [x: string]: unknown }
	| { readonly property: "z-index"; readonly [x: string]: unknown }
	| { readonly property: "container-type"; readonly [x: string]: unknown }
	| { readonly property: "container-name"; readonly [x: string]: unknown }
	| { readonly property: "container"; readonly [x: string]: unknown }
	| { readonly property: "view-transition-name"; readonly [x: string]: unknown }
	| { readonly property: "view-transition-class"; readonly [x: string]: unknown }
	| { readonly property: "view-transition-group"; readonly [x: string]: unknown }
	| { readonly property: "color-scheme"; readonly [x: string]: unknown }
	| { readonly property: "print-color-adjust"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly property: "all"; readonly [x: string]: unknown }
	| { readonly property: string; readonly [x: string]: unknown };

export type Size =
	| { readonly type: "auto"; readonly [x: string]: unknown }
	| {
			readonly type: "length-percentage";
			readonly value: DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  }
	| { readonly type: "min-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly type: "max-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly type: "fit-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| {
			readonly type: "fit-content-function";
			readonly value: DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  }
	| { readonly type: "stretch"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
	| { readonly type: "contain"; readonly [x: string]: unknown };

export type Transition = {
	readonly delay:
		| { readonly type: "seconds"; readonly value: number; readonly [x: string]: unknown }
		| { readonly type: "milliseconds"; readonly value: number; readonly [x: string]: unknown };
	readonly duration:
		| { readonly type: "seconds"; readonly value: number; readonly [x: string]: unknown }
		| { readonly type: "milliseconds"; readonly value: number; readonly [x: string]: unknown };
	readonly property:
		| { readonly property: "background-color"; readonly [x: string]: unknown }
		| { readonly property: "background-image"; readonly [x: string]: unknown }
		| { readonly property: "background-position-x"; readonly [x: string]: unknown }
		| { readonly property: "background-position-y"; readonly [x: string]: unknown }
		| { readonly property: "background-position"; readonly [x: string]: unknown }
		| { readonly property: "background-size"; readonly [x: string]: unknown }
		| { readonly property: "background-repeat"; readonly [x: string]: unknown }
		| { readonly property: "background-attachment"; readonly [x: string]: unknown }
		| { readonly property: "background-clip"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "background-origin"; readonly [x: string]: unknown }
		| { readonly property: "background"; readonly [x: string]: unknown }
		| { readonly property: "box-shadow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "opacity"; readonly [x: string]: unknown }
		| { readonly property: "color"; readonly [x: string]: unknown }
		| { readonly property: "display"; readonly [x: string]: unknown }
		| { readonly property: "visibility"; readonly [x: string]: unknown }
		| { readonly property: "width"; readonly [x: string]: unknown }
		| { readonly property: "height"; readonly [x: string]: unknown }
		| { readonly property: "min-width"; readonly [x: string]: unknown }
		| { readonly property: "min-height"; readonly [x: string]: unknown }
		| { readonly property: "max-width"; readonly [x: string]: unknown }
		| { readonly property: "max-height"; readonly [x: string]: unknown }
		| { readonly property: "block-size"; readonly [x: string]: unknown }
		| { readonly property: "inline-size"; readonly [x: string]: unknown }
		| { readonly property: "min-block-size"; readonly [x: string]: unknown }
		| { readonly property: "min-inline-size"; readonly [x: string]: unknown }
		| { readonly property: "max-block-size"; readonly [x: string]: unknown }
		| { readonly property: "max-inline-size"; readonly [x: string]: unknown }
		| { readonly property: "box-sizing"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "aspect-ratio"; readonly [x: string]: unknown }
		| { readonly property: "overflow"; readonly [x: string]: unknown }
		| { readonly property: "overflow-x"; readonly [x: string]: unknown }
		| { readonly property: "overflow-y"; readonly [x: string]: unknown }
		| { readonly property: "text-overflow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "position"; readonly [x: string]: unknown }
		| { readonly property: "top"; readonly [x: string]: unknown }
		| { readonly property: "bottom"; readonly [x: string]: unknown }
		| { readonly property: "left"; readonly [x: string]: unknown }
		| { readonly property: "right"; readonly [x: string]: unknown }
		| { readonly property: "inset-block-start"; readonly [x: string]: unknown }
		| { readonly property: "inset-block-end"; readonly [x: string]: unknown }
		| { readonly property: "inset-inline-start"; readonly [x: string]: unknown }
		| { readonly property: "inset-inline-end"; readonly [x: string]: unknown }
		| { readonly property: "inset-block"; readonly [x: string]: unknown }
		| { readonly property: "inset-inline"; readonly [x: string]: unknown }
		| { readonly property: "inset"; readonly [x: string]: unknown }
		| { readonly property: "border-spacing"; readonly [x: string]: unknown }
		| { readonly property: "border-top-color"; readonly [x: string]: unknown }
		| { readonly property: "border-bottom-color"; readonly [x: string]: unknown }
		| { readonly property: "border-left-color"; readonly [x: string]: unknown }
		| { readonly property: "border-right-color"; readonly [x: string]: unknown }
		| { readonly property: "border-block-start-color"; readonly [x: string]: unknown }
		| { readonly property: "border-block-end-color"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-start-color"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-end-color"; readonly [x: string]: unknown }
		| { readonly property: "border-top-style"; readonly [x: string]: unknown }
		| { readonly property: "border-bottom-style"; readonly [x: string]: unknown }
		| { readonly property: "border-left-style"; readonly [x: string]: unknown }
		| { readonly property: "border-right-style"; readonly [x: string]: unknown }
		| { readonly property: "border-block-start-style"; readonly [x: string]: unknown }
		| { readonly property: "border-block-end-style"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-start-style"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-end-style"; readonly [x: string]: unknown }
		| { readonly property: "border-top-width"; readonly [x: string]: unknown }
		| { readonly property: "border-bottom-width"; readonly [x: string]: unknown }
		| { readonly property: "border-left-width"; readonly [x: string]: unknown }
		| { readonly property: "border-right-width"; readonly [x: string]: unknown }
		| { readonly property: "border-block-start-width"; readonly [x: string]: unknown }
		| { readonly property: "border-block-end-width"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-start-width"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-end-width"; readonly [x: string]: unknown }
		| {
				readonly property: "border-top-left-radius";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| {
				readonly property: "border-top-right-radius";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| {
				readonly property: "border-bottom-left-radius";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| {
				readonly property: "border-bottom-right-radius";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| { readonly property: "border-start-start-radius"; readonly [x: string]: unknown }
		| { readonly property: "border-start-end-radius"; readonly [x: string]: unknown }
		| { readonly property: "border-end-start-radius"; readonly [x: string]: unknown }
		| { readonly property: "border-end-end-radius"; readonly [x: string]: unknown }
		| { readonly property: "border-radius"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "border-image-source"; readonly [x: string]: unknown }
		| { readonly property: "border-image-outset"; readonly [x: string]: unknown }
		| { readonly property: "border-image-repeat"; readonly [x: string]: unknown }
		| { readonly property: "border-image-width"; readonly [x: string]: unknown }
		| { readonly property: "border-image-slice"; readonly [x: string]: unknown }
		| { readonly property: "border-image"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "border-color"; readonly [x: string]: unknown }
		| { readonly property: "border-style"; readonly [x: string]: unknown }
		| { readonly property: "border-width"; readonly [x: string]: unknown }
		| { readonly property: "border-block-color"; readonly [x: string]: unknown }
		| { readonly property: "border-block-style"; readonly [x: string]: unknown }
		| { readonly property: "border-block-width"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-color"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-style"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-width"; readonly [x: string]: unknown }
		| { readonly property: "border"; readonly [x: string]: unknown }
		| { readonly property: "border-top"; readonly [x: string]: unknown }
		| { readonly property: "border-bottom"; readonly [x: string]: unknown }
		| { readonly property: "border-left"; readonly [x: string]: unknown }
		| { readonly property: "border-right"; readonly [x: string]: unknown }
		| { readonly property: "border-block"; readonly [x: string]: unknown }
		| { readonly property: "border-block-start"; readonly [x: string]: unknown }
		| { readonly property: "border-block-end"; readonly [x: string]: unknown }
		| { readonly property: "border-inline"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-start"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-end"; readonly [x: string]: unknown }
		| { readonly property: "outline"; readonly [x: string]: unknown }
		| { readonly property: "outline-color"; readonly [x: string]: unknown }
		| { readonly property: "outline-style"; readonly [x: string]: unknown }
		| { readonly property: "outline-width"; readonly [x: string]: unknown }
		| { readonly property: "flex-direction"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-wrap"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-flow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-grow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-shrink"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-basis"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "order"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "align-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "justify-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "place-content"; readonly [x: string]: unknown }
		| { readonly property: "align-self"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "justify-self"; readonly [x: string]: unknown }
		| { readonly property: "place-self"; readonly [x: string]: unknown }
		| { readonly property: "align-items"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "justify-items"; readonly [x: string]: unknown }
		| { readonly property: "place-items"; readonly [x: string]: unknown }
		| { readonly property: "row-gap"; readonly [x: string]: unknown }
		| { readonly property: "column-gap"; readonly [x: string]: unknown }
		| { readonly property: "gap"; readonly [x: string]: unknown }
		| { readonly property: "box-orient"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "box-direction"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "box-ordinal-group"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "box-align"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "box-flex"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "box-flex-group"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "box-pack"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "box-lines"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-pack"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-order"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-align"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-item-align"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-line-pack"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-positive"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-negative"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-preferred-size"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "grid-template-columns"; readonly [x: string]: unknown }
		| { readonly property: "grid-template-rows"; readonly [x: string]: unknown }
		| { readonly property: "grid-auto-columns"; readonly [x: string]: unknown }
		| { readonly property: "grid-auto-rows"; readonly [x: string]: unknown }
		| { readonly property: "grid-auto-flow"; readonly [x: string]: unknown }
		| { readonly property: "grid-template-areas"; readonly [x: string]: unknown }
		| { readonly property: "grid-template"; readonly [x: string]: unknown }
		| { readonly property: "grid"; readonly [x: string]: unknown }
		| { readonly property: "grid-row-start"; readonly [x: string]: unknown }
		| { readonly property: "grid-row-end"; readonly [x: string]: unknown }
		| { readonly property: "grid-column-start"; readonly [x: string]: unknown }
		| { readonly property: "grid-column-end"; readonly [x: string]: unknown }
		| { readonly property: "grid-row"; readonly [x: string]: unknown }
		| { readonly property: "grid-column"; readonly [x: string]: unknown }
		| { readonly property: "grid-area"; readonly [x: string]: unknown }
		| { readonly property: "margin-top"; readonly [x: string]: unknown }
		| { readonly property: "margin-bottom"; readonly [x: string]: unknown }
		| { readonly property: "margin-left"; readonly [x: string]: unknown }
		| { readonly property: "margin-right"; readonly [x: string]: unknown }
		| { readonly property: "margin-block-start"; readonly [x: string]: unknown }
		| { readonly property: "margin-block-end"; readonly [x: string]: unknown }
		| { readonly property: "margin-inline-start"; readonly [x: string]: unknown }
		| { readonly property: "margin-inline-end"; readonly [x: string]: unknown }
		| { readonly property: "margin-block"; readonly [x: string]: unknown }
		| { readonly property: "margin-inline"; readonly [x: string]: unknown }
		| { readonly property: "margin"; readonly [x: string]: unknown }
		| { readonly property: "padding-top"; readonly [x: string]: unknown }
		| { readonly property: "padding-bottom"; readonly [x: string]: unknown }
		| { readonly property: "padding-left"; readonly [x: string]: unknown }
		| { readonly property: "padding-right"; readonly [x: string]: unknown }
		| { readonly property: "padding-block-start"; readonly [x: string]: unknown }
		| { readonly property: "padding-block-end"; readonly [x: string]: unknown }
		| { readonly property: "padding-inline-start"; readonly [x: string]: unknown }
		| { readonly property: "padding-inline-end"; readonly [x: string]: unknown }
		| { readonly property: "padding-block"; readonly [x: string]: unknown }
		| { readonly property: "padding-inline"; readonly [x: string]: unknown }
		| { readonly property: "padding"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-top"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-bottom"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-left"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-right"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-block-start"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-block-end"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-inline-start"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-inline-end"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-block"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-inline"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-top"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-bottom"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-left"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-right"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-block-start"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-block-end"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-inline-start"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-inline-end"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-block"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-inline"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding"; readonly [x: string]: unknown }
		| { readonly property: "font-weight"; readonly [x: string]: unknown }
		| { readonly property: "font-size"; readonly [x: string]: unknown }
		| { readonly property: "font-stretch"; readonly [x: string]: unknown }
		| { readonly property: "font-family"; readonly [x: string]: unknown }
		| { readonly property: "font-style"; readonly [x: string]: unknown }
		| { readonly property: "font-variant-caps"; readonly [x: string]: unknown }
		| { readonly property: "line-height"; readonly [x: string]: unknown }
		| { readonly property: "font"; readonly [x: string]: unknown }
		| { readonly property: "vertical-align"; readonly [x: string]: unknown }
		| { readonly property: "font-palette"; readonly [x: string]: unknown }
		| { readonly property: "transition-property"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "transition-duration"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "transition-delay"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| {
				readonly property: "transition-timing-function";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| { readonly property: "transition"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "animation-name"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "animation-duration"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| {
				readonly property: "animation-timing-function";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| {
				readonly property: "animation-iteration-count";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| { readonly property: "animation-direction"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "animation-play-state"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "animation-delay"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "animation-fill-mode"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "animation-composition"; readonly [x: string]: unknown }
		| { readonly property: "animation-timeline"; readonly [x: string]: unknown }
		| { readonly property: "animation-range-start"; readonly [x: string]: unknown }
		| { readonly property: "animation-range-end"; readonly [x: string]: unknown }
		| { readonly property: "animation-range"; readonly [x: string]: unknown }
		| { readonly property: "animation"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "transform"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "transform-origin"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "transform-style"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "transform-box"; readonly [x: string]: unknown }
		| { readonly property: "backface-visibility"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "perspective"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "perspective-origin"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "translate"; readonly [x: string]: unknown }
		| { readonly property: "rotate"; readonly [x: string]: unknown }
		| { readonly property: "scale"; readonly [x: string]: unknown }
		| { readonly property: "text-transform"; readonly [x: string]: unknown }
		| { readonly property: "white-space"; readonly [x: string]: unknown }
		| { readonly property: "tab-size"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "word-break"; readonly [x: string]: unknown }
		| { readonly property: "line-break"; readonly [x: string]: unknown }
		| { readonly property: "hyphens"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "overflow-wrap"; readonly [x: string]: unknown }
		| { readonly property: "word-wrap"; readonly [x: string]: unknown }
		| { readonly property: "text-align"; readonly [x: string]: unknown }
		| { readonly property: "text-align-last"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "text-justify"; readonly [x: string]: unknown }
		| { readonly property: "word-spacing"; readonly [x: string]: unknown }
		| { readonly property: "letter-spacing"; readonly [x: string]: unknown }
		| { readonly property: "text-indent"; readonly [x: string]: unknown }
		| { readonly property: "text-decoration-line"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "text-decoration-style"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "text-decoration-color"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "text-decoration-thickness"; readonly [x: string]: unknown }
		| { readonly property: "text-decoration"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| {
				readonly property: "text-decoration-skip-ink";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| { readonly property: "text-emphasis-style"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "text-emphasis-color"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "text-emphasis"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| {
				readonly property: "text-emphasis-position";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| { readonly property: "text-shadow"; readonly [x: string]: unknown }
		| { readonly property: "text-size-adjust"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "direction"; readonly [x: string]: unknown }
		| { readonly property: "unicode-bidi"; readonly [x: string]: unknown }
		| { readonly property: "box-decoration-break"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "resize"; readonly [x: string]: unknown }
		| { readonly property: "cursor"; readonly [x: string]: unknown }
		| { readonly property: "caret-color"; readonly [x: string]: unknown }
		| { readonly property: "caret-shape"; readonly [x: string]: unknown }
		| { readonly property: "caret"; readonly [x: string]: unknown }
		| { readonly property: "user-select"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "accent-color"; readonly [x: string]: unknown }
		| { readonly property: "appearance"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "list-style-type"; readonly [x: string]: unknown }
		| { readonly property: "list-style-image"; readonly [x: string]: unknown }
		| { readonly property: "list-style-position"; readonly [x: string]: unknown }
		| { readonly property: "list-style"; readonly [x: string]: unknown }
		| { readonly property: "marker-side"; readonly [x: string]: unknown }
		| { readonly property: "composes"; readonly [x: string]: unknown }
		| { readonly property: "fill"; readonly [x: string]: unknown }
		| { readonly property: "fill-rule"; readonly [x: string]: unknown }
		| { readonly property: "fill-opacity"; readonly [x: string]: unknown }
		| { readonly property: "stroke"; readonly [x: string]: unknown }
		| { readonly property: "stroke-opacity"; readonly [x: string]: unknown }
		| { readonly property: "stroke-width"; readonly [x: string]: unknown }
		| { readonly property: "stroke-linecap"; readonly [x: string]: unknown }
		| { readonly property: "stroke-linejoin"; readonly [x: string]: unknown }
		| { readonly property: "stroke-miterlimit"; readonly [x: string]: unknown }
		| { readonly property: "stroke-dasharray"; readonly [x: string]: unknown }
		| { readonly property: "stroke-dashoffset"; readonly [x: string]: unknown }
		| { readonly property: "marker-start"; readonly [x: string]: unknown }
		| { readonly property: "marker-mid"; readonly [x: string]: unknown }
		| { readonly property: "marker-end"; readonly [x: string]: unknown }
		| { readonly property: "marker"; readonly [x: string]: unknown }
		| { readonly property: "color-interpolation"; readonly [x: string]: unknown }
		| { readonly property: "color-interpolation-filters"; readonly [x: string]: unknown }
		| { readonly property: "color-rendering"; readonly [x: string]: unknown }
		| { readonly property: "shape-rendering"; readonly [x: string]: unknown }
		| { readonly property: "text-rendering"; readonly [x: string]: unknown }
		| { readonly property: "image-rendering"; readonly [x: string]: unknown }
		| { readonly property: "clip-path"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "clip-rule"; readonly [x: string]: unknown }
		| { readonly property: "mask-image"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-mode"; readonly [x: string]: unknown }
		| { readonly property: "mask-repeat"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-position-x"; readonly [x: string]: unknown }
		| { readonly property: "mask-position-y"; readonly [x: string]: unknown }
		| { readonly property: "mask-position"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-clip"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-origin"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-size"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-composite"; readonly [x: string]: unknown }
		| { readonly property: "mask-type"; readonly [x: string]: unknown }
		| { readonly property: "mask"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-border-source"; readonly [x: string]: unknown }
		| { readonly property: "mask-border-mode"; readonly [x: string]: unknown }
		| { readonly property: "mask-border-slice"; readonly [x: string]: unknown }
		| { readonly property: "mask-border-width"; readonly [x: string]: unknown }
		| { readonly property: "mask-border-outset"; readonly [x: string]: unknown }
		| { readonly property: "mask-border-repeat"; readonly [x: string]: unknown }
		| { readonly property: "mask-border"; readonly [x: string]: unknown }
		| { readonly property: "-webkit-mask-composite"; readonly [x: string]: unknown }
		| { readonly property: "mask-source-type"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-box-image"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-box-image-source"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-box-image-slice"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-box-image-width"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-box-image-outset"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-box-image-repeat"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "filter"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "backdrop-filter"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mix-blend-mode"; readonly [x: string]: unknown }
		| { readonly property: "z-index"; readonly [x: string]: unknown }
		| { readonly property: "container-type"; readonly [x: string]: unknown }
		| { readonly property: "container-name"; readonly [x: string]: unknown }
		| { readonly property: "container"; readonly [x: string]: unknown }
		| { readonly property: "view-transition-name"; readonly [x: string]: unknown }
		| { readonly property: "view-transition-class"; readonly [x: string]: unknown }
		| { readonly property: "view-transition-group"; readonly [x: string]: unknown }
		| { readonly property: "color-scheme"; readonly [x: string]: unknown }
		| { readonly property: "print-color-adjust"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "all"; readonly [x: string]: unknown }
		| { readonly property: string; readonly [x: string]: unknown };
	readonly timingFunction:
		| { readonly type: "linear"; readonly [x: string]: unknown }
		| { readonly type: "ease"; readonly [x: string]: unknown }
		| { readonly type: "ease-in"; readonly [x: string]: unknown }
		| { readonly type: "ease-out"; readonly [x: string]: unknown }
		| { readonly type: "ease-in-out"; readonly [x: string]: unknown }
		| {
				readonly type: "cubic-bezier";
				readonly x1: number;
				readonly x2: number;
				readonly y1: number;
				readonly y2: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly count: number;
				readonly position?:
					| { readonly type: "start"; readonly [x: string]: unknown }
					| { readonly type: "end"; readonly [x: string]: unknown }
					| { readonly type: "jump-none"; readonly [x: string]: unknown }
					| { readonly type: "jump-both"; readonly [x: string]: unknown };
				readonly type: "steps";
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type UnparsedProperty = {
	readonly propertyId:
		| { readonly property: "background-color"; readonly [x: string]: unknown }
		| { readonly property: "background-image"; readonly [x: string]: unknown }
		| { readonly property: "background-position-x"; readonly [x: string]: unknown }
		| { readonly property: "background-position-y"; readonly [x: string]: unknown }
		| { readonly property: "background-position"; readonly [x: string]: unknown }
		| { readonly property: "background-size"; readonly [x: string]: unknown }
		| { readonly property: "background-repeat"; readonly [x: string]: unknown }
		| { readonly property: "background-attachment"; readonly [x: string]: unknown }
		| { readonly property: "background-clip"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "background-origin"; readonly [x: string]: unknown }
		| { readonly property: "background"; readonly [x: string]: unknown }
		| { readonly property: "box-shadow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "opacity"; readonly [x: string]: unknown }
		| { readonly property: "color"; readonly [x: string]: unknown }
		| { readonly property: "display"; readonly [x: string]: unknown }
		| { readonly property: "visibility"; readonly [x: string]: unknown }
		| { readonly property: "width"; readonly [x: string]: unknown }
		| { readonly property: "height"; readonly [x: string]: unknown }
		| { readonly property: "min-width"; readonly [x: string]: unknown }
		| { readonly property: "min-height"; readonly [x: string]: unknown }
		| { readonly property: "max-width"; readonly [x: string]: unknown }
		| { readonly property: "max-height"; readonly [x: string]: unknown }
		| { readonly property: "block-size"; readonly [x: string]: unknown }
		| { readonly property: "inline-size"; readonly [x: string]: unknown }
		| { readonly property: "min-block-size"; readonly [x: string]: unknown }
		| { readonly property: "min-inline-size"; readonly [x: string]: unknown }
		| { readonly property: "max-block-size"; readonly [x: string]: unknown }
		| { readonly property: "max-inline-size"; readonly [x: string]: unknown }
		| { readonly property: "box-sizing"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "aspect-ratio"; readonly [x: string]: unknown }
		| { readonly property: "overflow"; readonly [x: string]: unknown }
		| { readonly property: "overflow-x"; readonly [x: string]: unknown }
		| { readonly property: "overflow-y"; readonly [x: string]: unknown }
		| { readonly property: "text-overflow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "position"; readonly [x: string]: unknown }
		| { readonly property: "top"; readonly [x: string]: unknown }
		| { readonly property: "bottom"; readonly [x: string]: unknown }
		| { readonly property: "left"; readonly [x: string]: unknown }
		| { readonly property: "right"; readonly [x: string]: unknown }
		| { readonly property: "inset-block-start"; readonly [x: string]: unknown }
		| { readonly property: "inset-block-end"; readonly [x: string]: unknown }
		| { readonly property: "inset-inline-start"; readonly [x: string]: unknown }
		| { readonly property: "inset-inline-end"; readonly [x: string]: unknown }
		| { readonly property: "inset-block"; readonly [x: string]: unknown }
		| { readonly property: "inset-inline"; readonly [x: string]: unknown }
		| { readonly property: "inset"; readonly [x: string]: unknown }
		| { readonly property: "border-spacing"; readonly [x: string]: unknown }
		| { readonly property: "border-top-color"; readonly [x: string]: unknown }
		| { readonly property: "border-bottom-color"; readonly [x: string]: unknown }
		| { readonly property: "border-left-color"; readonly [x: string]: unknown }
		| { readonly property: "border-right-color"; readonly [x: string]: unknown }
		| { readonly property: "border-block-start-color"; readonly [x: string]: unknown }
		| { readonly property: "border-block-end-color"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-start-color"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-end-color"; readonly [x: string]: unknown }
		| { readonly property: "border-top-style"; readonly [x: string]: unknown }
		| { readonly property: "border-bottom-style"; readonly [x: string]: unknown }
		| { readonly property: "border-left-style"; readonly [x: string]: unknown }
		| { readonly property: "border-right-style"; readonly [x: string]: unknown }
		| { readonly property: "border-block-start-style"; readonly [x: string]: unknown }
		| { readonly property: "border-block-end-style"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-start-style"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-end-style"; readonly [x: string]: unknown }
		| { readonly property: "border-top-width"; readonly [x: string]: unknown }
		| { readonly property: "border-bottom-width"; readonly [x: string]: unknown }
		| { readonly property: "border-left-width"; readonly [x: string]: unknown }
		| { readonly property: "border-right-width"; readonly [x: string]: unknown }
		| { readonly property: "border-block-start-width"; readonly [x: string]: unknown }
		| { readonly property: "border-block-end-width"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-start-width"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-end-width"; readonly [x: string]: unknown }
		| {
				readonly property: "border-top-left-radius";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| {
				readonly property: "border-top-right-radius";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| {
				readonly property: "border-bottom-left-radius";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| {
				readonly property: "border-bottom-right-radius";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| { readonly property: "border-start-start-radius"; readonly [x: string]: unknown }
		| { readonly property: "border-start-end-radius"; readonly [x: string]: unknown }
		| { readonly property: "border-end-start-radius"; readonly [x: string]: unknown }
		| { readonly property: "border-end-end-radius"; readonly [x: string]: unknown }
		| { readonly property: "border-radius"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "border-image-source"; readonly [x: string]: unknown }
		| { readonly property: "border-image-outset"; readonly [x: string]: unknown }
		| { readonly property: "border-image-repeat"; readonly [x: string]: unknown }
		| { readonly property: "border-image-width"; readonly [x: string]: unknown }
		| { readonly property: "border-image-slice"; readonly [x: string]: unknown }
		| { readonly property: "border-image"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "border-color"; readonly [x: string]: unknown }
		| { readonly property: "border-style"; readonly [x: string]: unknown }
		| { readonly property: "border-width"; readonly [x: string]: unknown }
		| { readonly property: "border-block-color"; readonly [x: string]: unknown }
		| { readonly property: "border-block-style"; readonly [x: string]: unknown }
		| { readonly property: "border-block-width"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-color"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-style"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-width"; readonly [x: string]: unknown }
		| { readonly property: "border"; readonly [x: string]: unknown }
		| { readonly property: "border-top"; readonly [x: string]: unknown }
		| { readonly property: "border-bottom"; readonly [x: string]: unknown }
		| { readonly property: "border-left"; readonly [x: string]: unknown }
		| { readonly property: "border-right"; readonly [x: string]: unknown }
		| { readonly property: "border-block"; readonly [x: string]: unknown }
		| { readonly property: "border-block-start"; readonly [x: string]: unknown }
		| { readonly property: "border-block-end"; readonly [x: string]: unknown }
		| { readonly property: "border-inline"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-start"; readonly [x: string]: unknown }
		| { readonly property: "border-inline-end"; readonly [x: string]: unknown }
		| { readonly property: "outline"; readonly [x: string]: unknown }
		| { readonly property: "outline-color"; readonly [x: string]: unknown }
		| { readonly property: "outline-style"; readonly [x: string]: unknown }
		| { readonly property: "outline-width"; readonly [x: string]: unknown }
		| { readonly property: "flex-direction"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-wrap"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-flow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-grow"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-shrink"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-basis"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "order"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "align-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "justify-content"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "place-content"; readonly [x: string]: unknown }
		| { readonly property: "align-self"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "justify-self"; readonly [x: string]: unknown }
		| { readonly property: "place-self"; readonly [x: string]: unknown }
		| { readonly property: "align-items"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "justify-items"; readonly [x: string]: unknown }
		| { readonly property: "place-items"; readonly [x: string]: unknown }
		| { readonly property: "row-gap"; readonly [x: string]: unknown }
		| { readonly property: "column-gap"; readonly [x: string]: unknown }
		| { readonly property: "gap"; readonly [x: string]: unknown }
		| { readonly property: "box-orient"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "box-direction"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "box-ordinal-group"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "box-align"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "box-flex"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "box-flex-group"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "box-pack"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "box-lines"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-pack"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-order"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-align"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-item-align"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-line-pack"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-positive"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-negative"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "flex-preferred-size"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "grid-template-columns"; readonly [x: string]: unknown }
		| { readonly property: "grid-template-rows"; readonly [x: string]: unknown }
		| { readonly property: "grid-auto-columns"; readonly [x: string]: unknown }
		| { readonly property: "grid-auto-rows"; readonly [x: string]: unknown }
		| { readonly property: "grid-auto-flow"; readonly [x: string]: unknown }
		| { readonly property: "grid-template-areas"; readonly [x: string]: unknown }
		| { readonly property: "grid-template"; readonly [x: string]: unknown }
		| { readonly property: "grid"; readonly [x: string]: unknown }
		| { readonly property: "grid-row-start"; readonly [x: string]: unknown }
		| { readonly property: "grid-row-end"; readonly [x: string]: unknown }
		| { readonly property: "grid-column-start"; readonly [x: string]: unknown }
		| { readonly property: "grid-column-end"; readonly [x: string]: unknown }
		| { readonly property: "grid-row"; readonly [x: string]: unknown }
		| { readonly property: "grid-column"; readonly [x: string]: unknown }
		| { readonly property: "grid-area"; readonly [x: string]: unknown }
		| { readonly property: "margin-top"; readonly [x: string]: unknown }
		| { readonly property: "margin-bottom"; readonly [x: string]: unknown }
		| { readonly property: "margin-left"; readonly [x: string]: unknown }
		| { readonly property: "margin-right"; readonly [x: string]: unknown }
		| { readonly property: "margin-block-start"; readonly [x: string]: unknown }
		| { readonly property: "margin-block-end"; readonly [x: string]: unknown }
		| { readonly property: "margin-inline-start"; readonly [x: string]: unknown }
		| { readonly property: "margin-inline-end"; readonly [x: string]: unknown }
		| { readonly property: "margin-block"; readonly [x: string]: unknown }
		| { readonly property: "margin-inline"; readonly [x: string]: unknown }
		| { readonly property: "margin"; readonly [x: string]: unknown }
		| { readonly property: "padding-top"; readonly [x: string]: unknown }
		| { readonly property: "padding-bottom"; readonly [x: string]: unknown }
		| { readonly property: "padding-left"; readonly [x: string]: unknown }
		| { readonly property: "padding-right"; readonly [x: string]: unknown }
		| { readonly property: "padding-block-start"; readonly [x: string]: unknown }
		| { readonly property: "padding-block-end"; readonly [x: string]: unknown }
		| { readonly property: "padding-inline-start"; readonly [x: string]: unknown }
		| { readonly property: "padding-inline-end"; readonly [x: string]: unknown }
		| { readonly property: "padding-block"; readonly [x: string]: unknown }
		| { readonly property: "padding-inline"; readonly [x: string]: unknown }
		| { readonly property: "padding"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-top"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-bottom"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-left"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-right"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-block-start"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-block-end"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-inline-start"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-inline-end"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-block"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin-inline"; readonly [x: string]: unknown }
		| { readonly property: "scroll-margin"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-top"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-bottom"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-left"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-right"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-block-start"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-block-end"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-inline-start"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-inline-end"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-block"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding-inline"; readonly [x: string]: unknown }
		| { readonly property: "scroll-padding"; readonly [x: string]: unknown }
		| { readonly property: "font-weight"; readonly [x: string]: unknown }
		| { readonly property: "font-size"; readonly [x: string]: unknown }
		| { readonly property: "font-stretch"; readonly [x: string]: unknown }
		| { readonly property: "font-family"; readonly [x: string]: unknown }
		| { readonly property: "font-style"; readonly [x: string]: unknown }
		| { readonly property: "font-variant-caps"; readonly [x: string]: unknown }
		| { readonly property: "line-height"; readonly [x: string]: unknown }
		| { readonly property: "font"; readonly [x: string]: unknown }
		| { readonly property: "vertical-align"; readonly [x: string]: unknown }
		| { readonly property: "font-palette"; readonly [x: string]: unknown }
		| { readonly property: "transition-property"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "transition-duration"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "transition-delay"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| {
				readonly property: "transition-timing-function";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| { readonly property: "transition"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "animation-name"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "animation-duration"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| {
				readonly property: "animation-timing-function";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| {
				readonly property: "animation-iteration-count";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| { readonly property: "animation-direction"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "animation-play-state"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "animation-delay"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "animation-fill-mode"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "animation-composition"; readonly [x: string]: unknown }
		| { readonly property: "animation-timeline"; readonly [x: string]: unknown }
		| { readonly property: "animation-range-start"; readonly [x: string]: unknown }
		| { readonly property: "animation-range-end"; readonly [x: string]: unknown }
		| { readonly property: "animation-range"; readonly [x: string]: unknown }
		| { readonly property: "animation"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "transform"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "transform-origin"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "transform-style"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "transform-box"; readonly [x: string]: unknown }
		| { readonly property: "backface-visibility"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "perspective"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "perspective-origin"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "translate"; readonly [x: string]: unknown }
		| { readonly property: "rotate"; readonly [x: string]: unknown }
		| { readonly property: "scale"; readonly [x: string]: unknown }
		| { readonly property: "text-transform"; readonly [x: string]: unknown }
		| { readonly property: "white-space"; readonly [x: string]: unknown }
		| { readonly property: "tab-size"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "word-break"; readonly [x: string]: unknown }
		| { readonly property: "line-break"; readonly [x: string]: unknown }
		| { readonly property: "hyphens"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "overflow-wrap"; readonly [x: string]: unknown }
		| { readonly property: "word-wrap"; readonly [x: string]: unknown }
		| { readonly property: "text-align"; readonly [x: string]: unknown }
		| { readonly property: "text-align-last"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "text-justify"; readonly [x: string]: unknown }
		| { readonly property: "word-spacing"; readonly [x: string]: unknown }
		| { readonly property: "letter-spacing"; readonly [x: string]: unknown }
		| { readonly property: "text-indent"; readonly [x: string]: unknown }
		| { readonly property: "text-decoration-line"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "text-decoration-style"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "text-decoration-color"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "text-decoration-thickness"; readonly [x: string]: unknown }
		| { readonly property: "text-decoration"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| {
				readonly property: "text-decoration-skip-ink";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| { readonly property: "text-emphasis-style"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "text-emphasis-color"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "text-emphasis"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| {
				readonly property: "text-emphasis-position";
				readonly vendorPrefix: VendorPrefix;
				readonly [x: string]: unknown;
		  }
		| { readonly property: "text-shadow"; readonly [x: string]: unknown }
		| { readonly property: "text-size-adjust"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "direction"; readonly [x: string]: unknown }
		| { readonly property: "unicode-bidi"; readonly [x: string]: unknown }
		| { readonly property: "box-decoration-break"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "resize"; readonly [x: string]: unknown }
		| { readonly property: "cursor"; readonly [x: string]: unknown }
		| { readonly property: "caret-color"; readonly [x: string]: unknown }
		| { readonly property: "caret-shape"; readonly [x: string]: unknown }
		| { readonly property: "caret"; readonly [x: string]: unknown }
		| { readonly property: "user-select"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "accent-color"; readonly [x: string]: unknown }
		| { readonly property: "appearance"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "list-style-type"; readonly [x: string]: unknown }
		| { readonly property: "list-style-image"; readonly [x: string]: unknown }
		| { readonly property: "list-style-position"; readonly [x: string]: unknown }
		| { readonly property: "list-style"; readonly [x: string]: unknown }
		| { readonly property: "marker-side"; readonly [x: string]: unknown }
		| { readonly property: "composes"; readonly [x: string]: unknown }
		| { readonly property: "fill"; readonly [x: string]: unknown }
		| { readonly property: "fill-rule"; readonly [x: string]: unknown }
		| { readonly property: "fill-opacity"; readonly [x: string]: unknown }
		| { readonly property: "stroke"; readonly [x: string]: unknown }
		| { readonly property: "stroke-opacity"; readonly [x: string]: unknown }
		| { readonly property: "stroke-width"; readonly [x: string]: unknown }
		| { readonly property: "stroke-linecap"; readonly [x: string]: unknown }
		| { readonly property: "stroke-linejoin"; readonly [x: string]: unknown }
		| { readonly property: "stroke-miterlimit"; readonly [x: string]: unknown }
		| { readonly property: "stroke-dasharray"; readonly [x: string]: unknown }
		| { readonly property: "stroke-dashoffset"; readonly [x: string]: unknown }
		| { readonly property: "marker-start"; readonly [x: string]: unknown }
		| { readonly property: "marker-mid"; readonly [x: string]: unknown }
		| { readonly property: "marker-end"; readonly [x: string]: unknown }
		| { readonly property: "marker"; readonly [x: string]: unknown }
		| { readonly property: "color-interpolation"; readonly [x: string]: unknown }
		| { readonly property: "color-interpolation-filters"; readonly [x: string]: unknown }
		| { readonly property: "color-rendering"; readonly [x: string]: unknown }
		| { readonly property: "shape-rendering"; readonly [x: string]: unknown }
		| { readonly property: "text-rendering"; readonly [x: string]: unknown }
		| { readonly property: "image-rendering"; readonly [x: string]: unknown }
		| { readonly property: "clip-path"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "clip-rule"; readonly [x: string]: unknown }
		| { readonly property: "mask-image"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-mode"; readonly [x: string]: unknown }
		| { readonly property: "mask-repeat"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-position-x"; readonly [x: string]: unknown }
		| { readonly property: "mask-position-y"; readonly [x: string]: unknown }
		| { readonly property: "mask-position"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-clip"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-origin"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-size"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-composite"; readonly [x: string]: unknown }
		| { readonly property: "mask-type"; readonly [x: string]: unknown }
		| { readonly property: "mask"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-border-source"; readonly [x: string]: unknown }
		| { readonly property: "mask-border-mode"; readonly [x: string]: unknown }
		| { readonly property: "mask-border-slice"; readonly [x: string]: unknown }
		| { readonly property: "mask-border-width"; readonly [x: string]: unknown }
		| { readonly property: "mask-border-outset"; readonly [x: string]: unknown }
		| { readonly property: "mask-border-repeat"; readonly [x: string]: unknown }
		| { readonly property: "mask-border"; readonly [x: string]: unknown }
		| { readonly property: "-webkit-mask-composite"; readonly [x: string]: unknown }
		| { readonly property: "mask-source-type"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-box-image"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-box-image-source"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-box-image-slice"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-box-image-width"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-box-image-outset"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mask-box-image-repeat"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "filter"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "backdrop-filter"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "mix-blend-mode"; readonly [x: string]: unknown }
		| { readonly property: "z-index"; readonly [x: string]: unknown }
		| { readonly property: "container-type"; readonly [x: string]: unknown }
		| { readonly property: "container-name"; readonly [x: string]: unknown }
		| { readonly property: "container"; readonly [x: string]: unknown }
		| { readonly property: "view-transition-name"; readonly [x: string]: unknown }
		| { readonly property: "view-transition-class"; readonly [x: string]: unknown }
		| { readonly property: "view-transition-group"; readonly [x: string]: unknown }
		| { readonly property: "color-scheme"; readonly [x: string]: unknown }
		| { readonly property: "print-color-adjust"; readonly vendorPrefix: VendorPrefix; readonly [x: string]: unknown }
		| { readonly property: "all"; readonly [x: string]: unknown }
		| { readonly property: string; readonly [x: string]: unknown };
	readonly value: ReadonlyArray<TokenOrValue>;
	readonly [x: string]: unknown;
};

export type CustomMediaRule = {
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly name: string;
	readonly query: { readonly mediaQueries: ReadonlyArray<MediaQuery>; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type ImportRule = {
	readonly layer?: ReadonlyArray<unknown> | null;
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly media?: { readonly mediaQueries: ReadonlyArray<MediaQuery>; readonly [x: string]: unknown };
	readonly supports?: SupportsCondition | null;
	readonly url: string;
	readonly [x: string]: unknown;
};

export type Gradient =
	| {
			readonly direction:
				| { readonly type: "angle"; readonly value: Angle; readonly [x: string]: unknown }
				| { readonly type: "horizontal"; readonly value: HorizontalPositionKeyword; readonly [x: string]: unknown }
				| { readonly type: "vertical"; readonly value: VerticalPositionKeyword; readonly [x: string]: unknown }
				| {
						readonly horizontal: "left" | "right";
						readonly type: "corner";
						readonly vertical: "top" | "bottom";
						readonly [x: string]: unknown;
				  };
			readonly items: ReadonlyArray<GradientItem_for_DimensionPercentage_for_LengthValue>;
			readonly type: "linear";
			readonly vendorPrefix: ReadonlyArray<Prefix>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly direction:
				| { readonly type: "angle"; readonly value: Angle; readonly [x: string]: unknown }
				| { readonly type: "horizontal"; readonly value: HorizontalPositionKeyword; readonly [x: string]: unknown }
				| { readonly type: "vertical"; readonly value: VerticalPositionKeyword; readonly [x: string]: unknown }
				| {
						readonly horizontal: "left" | "right";
						readonly type: "corner";
						readonly vertical: "top" | "bottom";
						readonly [x: string]: unknown;
				  };
			readonly items: ReadonlyArray<GradientItem_for_DimensionPercentage_for_LengthValue>;
			readonly type: "repeating-linear";
			readonly vendorPrefix: ReadonlyArray<Prefix>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly items: ReadonlyArray<GradientItem_for_DimensionPercentage_for_LengthValue>;
			readonly position: {
				readonly x:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| {
							readonly type: "length";
							readonly value: DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  }
					| {
							readonly offset?: DimensionPercentage_for_LengthValue | null;
							readonly side: "left" | "right";
							readonly type: "side";
							readonly [x: string]: unknown;
					  };
				readonly y:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| {
							readonly type: "length";
							readonly value: DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  }
					| {
							readonly offset?: DimensionPercentage_for_LengthValue | null;
							readonly side: "top" | "bottom";
							readonly type: "side";
							readonly [x: string]: unknown;
					  };
				readonly [x: string]: unknown;
			};
			readonly shape:
				| { readonly type: "ellipse"; readonly value: Ellipse; readonly [x: string]: unknown }
				| { readonly type: "circle"; readonly value: Circle; readonly [x: string]: unknown };
			readonly type: "radial";
			readonly vendorPrefix: ReadonlyArray<Prefix>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly items: ReadonlyArray<GradientItem_for_DimensionPercentage_for_LengthValue>;
			readonly position: {
				readonly x:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| {
							readonly type: "length";
							readonly value: DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  }
					| {
							readonly offset?: DimensionPercentage_for_LengthValue | null;
							readonly side: "left" | "right";
							readonly type: "side";
							readonly [x: string]: unknown;
					  };
				readonly y:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| {
							readonly type: "length";
							readonly value: DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  }
					| {
							readonly offset?: DimensionPercentage_for_LengthValue | null;
							readonly side: "top" | "bottom";
							readonly type: "side";
							readonly [x: string]: unknown;
					  };
				readonly [x: string]: unknown;
			};
			readonly shape:
				| { readonly type: "ellipse"; readonly value: Ellipse; readonly [x: string]: unknown }
				| { readonly type: "circle"; readonly value: Circle; readonly [x: string]: unknown };
			readonly type: "repeating-radial";
			readonly vendorPrefix: ReadonlyArray<Prefix>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly angle:
				| { readonly type: "deg"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "rad"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "grad"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "turn"; readonly value: number; readonly [x: string]: unknown };
			readonly items: ReadonlyArray<GradientItem_for_DimensionPercentage_for_Angle>;
			readonly position: {
				readonly x:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| {
							readonly type: "length";
							readonly value: DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  }
					| {
							readonly offset?: DimensionPercentage_for_LengthValue | null;
							readonly side: "left" | "right";
							readonly type: "side";
							readonly [x: string]: unknown;
					  };
				readonly y:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| {
							readonly type: "length";
							readonly value: DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  }
					| {
							readonly offset?: DimensionPercentage_for_LengthValue | null;
							readonly side: "top" | "bottom";
							readonly type: "side";
							readonly [x: string]: unknown;
					  };
				readonly [x: string]: unknown;
			};
			readonly type: "conic";
			readonly [x: string]: unknown;
	  }
	| {
			readonly angle:
				| { readonly type: "deg"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "rad"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "grad"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "turn"; readonly value: number; readonly [x: string]: unknown };
			readonly items: ReadonlyArray<GradientItem_for_DimensionPercentage_for_Angle>;
			readonly position: {
				readonly x:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| {
							readonly type: "length";
							readonly value: DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  }
					| {
							readonly offset?: DimensionPercentage_for_LengthValue | null;
							readonly side: "left" | "right";
							readonly type: "side";
							readonly [x: string]: unknown;
					  };
				readonly y:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| {
							readonly type: "length";
							readonly value: DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  }
					| {
							readonly offset?: DimensionPercentage_for_LengthValue | null;
							readonly side: "top" | "bottom";
							readonly type: "side";
							readonly [x: string]: unknown;
					  };
				readonly [x: string]: unknown;
			};
			readonly type: "repeating-conic";
			readonly [x: string]: unknown;
	  }
	| {
			readonly from: {
				readonly x:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| { readonly type: "number"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
					| { readonly type: "side"; readonly value: HorizontalPositionKeyword; readonly [x: string]: unknown };
				readonly y:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| { readonly type: "number"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
					| { readonly type: "side"; readonly value: VerticalPositionKeyword; readonly [x: string]: unknown };
				readonly [x: string]: unknown;
			};
			readonly kind: "linear";
			readonly stops: ReadonlyArray<WebKitColorStop>;
			readonly to: {
				readonly x:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| { readonly type: "number"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
					| { readonly type: "side"; readonly value: HorizontalPositionKeyword; readonly [x: string]: unknown };
				readonly y:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| { readonly type: "number"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
					| { readonly type: "side"; readonly value: VerticalPositionKeyword; readonly [x: string]: unknown };
				readonly [x: string]: unknown;
			};
			readonly [x: string]: unknown;
	  }
	| {
			readonly from: {
				readonly x:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| { readonly type: "number"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
					| { readonly type: "side"; readonly value: HorizontalPositionKeyword; readonly [x: string]: unknown };
				readonly y:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| { readonly type: "number"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
					| { readonly type: "side"; readonly value: VerticalPositionKeyword; readonly [x: string]: unknown };
				readonly [x: string]: unknown;
			};
			readonly kind: "radial";
			readonly r0: number;
			readonly r1: number;
			readonly stops: ReadonlyArray<WebKitColorStop>;
			readonly to: {
				readonly x:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| { readonly type: "number"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
					| { readonly type: "side"; readonly value: HorizontalPositionKeyword; readonly [x: string]: unknown };
				readonly y:
					| { readonly type: "center"; readonly [x: string]: unknown }
					| { readonly type: "number"; readonly value: NumberOrPercentage; readonly [x: string]: unknown }
					| { readonly type: "side"; readonly value: VerticalPositionKeyword; readonly [x: string]: unknown };
				readonly [x: string]: unknown;
			};
			readonly [x: string]: unknown;
	  };

export type UrlSource = {
	readonly format?: FontFormat | null;
	readonly tech: ReadonlyArray<FontTechnology>;
	readonly url: {
		readonly loc: { readonly column: number; readonly line: number; readonly [x: string]: unknown };
		readonly url: string;
		readonly [x: string]: unknown;
	};
	readonly [x: string]: unknown;
};

export type ViewTransitionProperty =
	| { readonly property: "navigation"; readonly value: Navigation; readonly [x: string]: unknown }
	| { readonly property: "types"; readonly value: NoneOrCustomIdentList; readonly [x: string]: unknown }
	| { readonly property: "custom"; readonly value: CustomProperty; readonly [x: string]: unknown };

export type Composes = {
	readonly from?: Specifier | null;
	readonly loc: { readonly column: number; readonly line: number; readonly [x: string]: unknown };
	readonly names: ReadonlyArray<String>;
	readonly [x: string]: unknown;
};

export type DashedIdentReference = {
	readonly from?: Specifier | null;
	readonly ident: string;
	readonly [x: string]: unknown;
};

export type EnvironmentVariable = {
	readonly fallback?: ReadonlyArray<unknown> | null;
	readonly indices?: ReadonlyArray<number>;
	readonly name:
		| { readonly type: "ua"; readonly value: UAEnvironmentVariable; readonly [x: string]: unknown }
		| {
				readonly from?: Specifier | null;
				readonly ident: string;
				readonly type: "custom";
				readonly [x: string]: unknown;
		  }
		| { readonly type: "unknown"; readonly value: String; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type Variable = {
	readonly fallback?: ReadonlyArray<unknown> | null;
	readonly name: { readonly from?: Specifier | null; readonly ident: string; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type TrackRepeat = {
	readonly count:
		| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
		| { readonly type: "auto-fill"; readonly [x: string]: unknown }
		| { readonly type: "auto-fit"; readonly [x: string]: unknown };
	readonly lineNames: ReadonlyArray<ReadonlyArray<String>>;
	readonly trackSizes: ReadonlyArray<TrackSize>;
	readonly [x: string]: unknown;
};

export type FilterList =
	| { readonly type: "none"; readonly [x: string]: unknown }
	| { readonly type: "filters"; readonly value: ReadonlyArray<Filter>; readonly [x: string]: unknown };

export type ClipPath =
	| { readonly type: "none"; readonly [x: string]: unknown }
	| { readonly type: "url"; readonly value: Url; readonly [x: string]: unknown }
	| {
			readonly referenceBox:
				| "border-box"
				| "padding-box"
				| "content-box"
				| "margin-box"
				| "fill-box"
				| "stroke-box"
				| "view-box";
			readonly shape:
				| { readonly type: "inset"; readonly value: InsetRect; readonly [x: string]: unknown }
				| { readonly type: "circle"; readonly value: Circle2; readonly [x: string]: unknown }
				| { readonly type: "ellipse"; readonly value: Ellipse2; readonly [x: string]: unknown }
				| { readonly type: "polygon"; readonly value: Polygon; readonly [x: string]: unknown };
			readonly type: "shape";
			readonly [x: string]: unknown;
	  }
	| { readonly type: "box"; readonly value: GeometryBox; readonly [x: string]: unknown };

export type Background = {
	readonly attachment: "scroll" | "fixed" | "local";
	readonly clip: "border-box" | "padding-box" | "content-box" | "border" | "text";
	readonly color:
		| { readonly type: "currentcolor"; readonly [x: string]: unknown }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "lab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "lch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly a: number;
				readonly alpha: number;
				readonly b: number;
				readonly l: number;
				readonly type: "oklab";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly c: number;
				readonly h: number;
				readonly l: number;
				readonly type: "oklch";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "srgb-linear";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "display-p3";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "a98-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "prophoto-rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rec2020";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d50";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly type: "xyz-d65";
				readonly x: number;
				readonly y: number;
				readonly z: number;
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly g: number;
				readonly r: number;
				readonly type: "rgb";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly h: number;
				readonly l: number;
				readonly s: number;
				readonly type: "hsl";
				readonly [x: string]: unknown;
		  }
		| {
				readonly alpha: number;
				readonly b: number;
				readonly h: number;
				readonly type: "hwb";
				readonly w: number;
				readonly [x: string]: unknown;
		  }
		| { readonly dark: CssColor; readonly light: CssColor; readonly type: "light-dark"; readonly [x: string]: unknown }
		| "accentcolor"
		| "accentcolortext"
		| "activetext"
		| "buttonborder"
		| "buttonface"
		| "buttontext"
		| "canvas"
		| "canvastext"
		| "field"
		| "fieldtext"
		| "graytext"
		| "highlight"
		| "highlighttext"
		| "linktext"
		| "mark"
		| "marktext"
		| "selecteditem"
		| "selecteditemtext"
		| "visitedtext"
		| "activeborder"
		| "activecaption"
		| "appworkspace"
		| "background"
		| "buttonhighlight"
		| "buttonshadow"
		| "captiontext"
		| "inactiveborder"
		| "inactivecaption"
		| "inactivecaptiontext"
		| "infobackground"
		| "infotext"
		| "menu"
		| "menutext"
		| "scrollbar"
		| "threeddarkshadow"
		| "threedface"
		| "threedhighlight"
		| "threedlightshadow"
		| "threedshadow"
		| "window"
		| "windowframe"
		| "windowtext";
	readonly image:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| { readonly type: "url"; readonly value: Url; readonly [x: string]: unknown }
		| { readonly type: "gradient"; readonly value: Gradient; readonly [x: string]: unknown }
		| { readonly type: "image-set"; readonly value: ImageSet; readonly [x: string]: unknown };
	readonly origin: "border-box" | "padding-box" | "content-box";
	readonly position: {
		readonly x:
			| { readonly type: "center"; readonly [x: string]: unknown }
			| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
			| {
					readonly offset?: DimensionPercentage_for_LengthValue | null;
					readonly side: "left" | "right";
					readonly type: "side";
					readonly [x: string]: unknown;
			  };
		readonly y:
			| { readonly type: "center"; readonly [x: string]: unknown }
			| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
			| {
					readonly offset?: DimensionPercentage_for_LengthValue | null;
					readonly side: "top" | "bottom";
					readonly type: "side";
					readonly [x: string]: unknown;
			  };
		readonly [x: string]: unknown;
	};
	readonly repeat: {
		readonly x: "repeat" | "space" | "round" | "no-repeat";
		readonly y: "repeat" | "space" | "round" | "no-repeat";
		readonly [x: string]: unknown;
	};
	readonly size:
		| {
				readonly height:
					| { readonly type: "auto"; readonly [x: string]: unknown }
					| {
							readonly type: "length-percentage";
							readonly value: DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  };
				readonly type: "explicit";
				readonly width:
					| { readonly type: "auto"; readonly [x: string]: unknown }
					| {
							readonly type: "length-percentage";
							readonly value: DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  };
				readonly [x: string]: unknown;
		  }
		| { readonly type: "cover"; readonly [x: string]: unknown }
		| { readonly type: "contain"; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type BorderImage = {
	readonly outset: readonly [LengthOrNumber, LengthOrNumber, LengthOrNumber, LengthOrNumber];
	readonly repeat: {
		readonly horizontal: "stretch" | "repeat" | "round" | "space";
		readonly vertical: "stretch" | "repeat" | "round" | "space";
		readonly [x: string]: unknown;
	};
	readonly slice: {
		readonly fill: boolean;
		readonly offsets: readonly [NumberOrPercentage, NumberOrPercentage, NumberOrPercentage, NumberOrPercentage];
		readonly [x: string]: unknown;
	};
	readonly source:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| { readonly type: "url"; readonly value: Url; readonly [x: string]: unknown }
		| { readonly type: "gradient"; readonly value: Gradient; readonly [x: string]: unknown }
		| { readonly type: "image-set"; readonly value: ImageSet; readonly [x: string]: unknown };
	readonly width: readonly [BorderImageSideWidth, BorderImageSideWidth, BorderImageSideWidth, BorderImageSideWidth];
	readonly [x: string]: unknown;
};

export type Image =
	| { readonly type: "none"; readonly [x: string]: unknown }
	| { readonly type: "url"; readonly value: Url; readonly [x: string]: unknown }
	| { readonly type: "gradient"; readonly value: Gradient; readonly [x: string]: unknown }
	| { readonly type: "image-set"; readonly value: ImageSet; readonly [x: string]: unknown };

export type Mask = {
	readonly clip:
		| { readonly type: "geometry-box"; readonly value: GeometryBox; readonly [x: string]: unknown }
		| { readonly type: "no-clip"; readonly [x: string]: unknown };
	readonly composite: "add" | "subtract" | "intersect" | "exclude";
	readonly image:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| { readonly type: "url"; readonly value: Url; readonly [x: string]: unknown }
		| { readonly type: "gradient"; readonly value: Gradient; readonly [x: string]: unknown }
		| { readonly type: "image-set"; readonly value: ImageSet; readonly [x: string]: unknown };
	readonly mode: "luminance" | "alpha" | "match-source";
	readonly origin: "border-box" | "padding-box" | "content-box" | "margin-box" | "fill-box" | "stroke-box" | "view-box";
	readonly position: {
		readonly x:
			| { readonly type: "center"; readonly [x: string]: unknown }
			| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
			| {
					readonly offset?: DimensionPercentage_for_LengthValue | null;
					readonly side: "left" | "right";
					readonly type: "side";
					readonly [x: string]: unknown;
			  };
		readonly y:
			| { readonly type: "center"; readonly [x: string]: unknown }
			| { readonly type: "length"; readonly value: DimensionPercentage_for_LengthValue; readonly [x: string]: unknown }
			| {
					readonly offset?: DimensionPercentage_for_LengthValue | null;
					readonly side: "top" | "bottom";
					readonly type: "side";
					readonly [x: string]: unknown;
			  };
		readonly [x: string]: unknown;
	};
	readonly repeat: {
		readonly x: "repeat" | "space" | "round" | "no-repeat";
		readonly y: "repeat" | "space" | "round" | "no-repeat";
		readonly [x: string]: unknown;
	};
	readonly size:
		| {
				readonly height:
					| { readonly type: "auto"; readonly [x: string]: unknown }
					| {
							readonly type: "length-percentage";
							readonly value: DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  };
				readonly type: "explicit";
				readonly width:
					| { readonly type: "auto"; readonly [x: string]: unknown }
					| {
							readonly type: "length-percentage";
							readonly value: DimensionPercentage_for_LengthValue;
							readonly [x: string]: unknown;
					  };
				readonly [x: string]: unknown;
		  }
		| { readonly type: "cover"; readonly [x: string]: unknown }
		| { readonly type: "contain"; readonly [x: string]: unknown };
	readonly [x: string]: unknown;
};

export type MaskBorder = {
	readonly mode: "luminance" | "alpha";
	readonly outset: readonly [LengthOrNumber, LengthOrNumber, LengthOrNumber, LengthOrNumber];
	readonly repeat: {
		readonly horizontal: "stretch" | "repeat" | "round" | "space";
		readonly vertical: "stretch" | "repeat" | "round" | "space";
		readonly [x: string]: unknown;
	};
	readonly slice: {
		readonly fill: boolean;
		readonly offsets: readonly [NumberOrPercentage, NumberOrPercentage, NumberOrPercentage, NumberOrPercentage];
		readonly [x: string]: unknown;
	};
	readonly source:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| { readonly type: "url"; readonly value: Url; readonly [x: string]: unknown }
		| { readonly type: "gradient"; readonly value: Gradient; readonly [x: string]: unknown }
		| { readonly type: "image-set"; readonly value: ImageSet; readonly [x: string]: unknown };
	readonly width: readonly [BorderImageSideWidth, BorderImageSideWidth, BorderImageSideWidth, BorderImageSideWidth];
	readonly [x: string]: unknown;
};

export type Source =
	| { readonly type: "url"; readonly value: UrlSource; readonly [x: string]: unknown }
	| { readonly type: "local"; readonly value: FontFamily; readonly [x: string]: unknown };

export type ViewTransitionRule = {
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly properties: ReadonlyArray<ViewTransitionProperty>;
	readonly [x: string]: unknown;
};

export type QueryFeature_for_ContainerSizeFeatureId =
	| {
			readonly name: "width" | "height" | "inline-size" | "block-size" | "aspect-ratio" | "orientation" | string;
			readonly type: "plain";
			readonly value:
				| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown }
				| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "integer"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "boolean"; readonly value: boolean; readonly [x: string]: unknown }
				| { readonly type: "resolution"; readonly value: Resolution; readonly [x: string]: unknown }
				| { readonly type: "ratio"; readonly value: Ratio; readonly [x: string]: unknown }
				| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
				| { readonly type: "env"; readonly value: EnvironmentVariable; readonly [x: string]: unknown };
			readonly [x: string]: unknown;
	  }
	| {
			readonly name: "width" | "height" | "inline-size" | "block-size" | "aspect-ratio" | "orientation" | string;
			readonly type: "boolean";
			readonly [x: string]: unknown;
	  }
	| {
			readonly name: "width" | "height" | "inline-size" | "block-size" | "aspect-ratio" | "orientation" | string;
			readonly operator: "equal" | "greater-than" | "greater-than-equal" | "less-than" | "less-than-equal";
			readonly type: "range";
			readonly value:
				| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown }
				| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "integer"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "boolean"; readonly value: boolean; readonly [x: string]: unknown }
				| { readonly type: "resolution"; readonly value: Resolution; readonly [x: string]: unknown }
				| { readonly type: "ratio"; readonly value: Ratio; readonly [x: string]: unknown }
				| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
				| { readonly type: "env"; readonly value: EnvironmentVariable; readonly [x: string]: unknown };
			readonly [x: string]: unknown;
	  }
	| {
			readonly end:
				| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown }
				| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "integer"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "boolean"; readonly value: boolean; readonly [x: string]: unknown }
				| { readonly type: "resolution"; readonly value: Resolution; readonly [x: string]: unknown }
				| { readonly type: "ratio"; readonly value: Ratio; readonly [x: string]: unknown }
				| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
				| { readonly type: "env"; readonly value: EnvironmentVariable; readonly [x: string]: unknown };
			readonly endOperator: "equal" | "greater-than" | "greater-than-equal" | "less-than" | "less-than-equal";
			readonly name: "width" | "height" | "inline-size" | "block-size" | "aspect-ratio" | "orientation" | string;
			readonly start:
				| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown }
				| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "integer"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "boolean"; readonly value: boolean; readonly [x: string]: unknown }
				| { readonly type: "resolution"; readonly value: Resolution; readonly [x: string]: unknown }
				| { readonly type: "ratio"; readonly value: Ratio; readonly [x: string]: unknown }
				| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
				| { readonly type: "env"; readonly value: EnvironmentVariable; readonly [x: string]: unknown };
			readonly startOperator: "equal" | "greater-than" | "greater-than-equal" | "less-than" | "less-than-equal";
			readonly type: "interval";
			readonly [x: string]: unknown;
	  };

export type QueryFeature_for_MediaFeatureId =
	| {
			readonly name:
				| "width"
				| "height"
				| "aspect-ratio"
				| "orientation"
				| "overflow-block"
				| "overflow-inline"
				| "horizontal-viewport-segments"
				| "vertical-viewport-segments"
				| "display-mode"
				| "resolution"
				| "scan"
				| "grid"
				| "update"
				| "environment-blending"
				| "color"
				| "color-index"
				| "monochrome"
				| "color-gamut"
				| "dynamic-range"
				| "inverted-colors"
				| "pointer"
				| "hover"
				| "any-pointer"
				| "any-hover"
				| "nav-controls"
				| "video-color-gamut"
				| "video-dynamic-range"
				| "scripting"
				| "prefers-reduced-motion"
				| "prefers-reduced-transparency"
				| "prefers-contrast"
				| "forced-colors"
				| "prefers-color-scheme"
				| "prefers-reduced-data"
				| "device-width"
				| "device-height"
				| "device-aspect-ratio"
				| "-webkit-device-pixel-ratio"
				| "-moz-device-pixel-ratio"
				| string;
			readonly type: "plain";
			readonly value:
				| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown }
				| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "integer"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "boolean"; readonly value: boolean; readonly [x: string]: unknown }
				| { readonly type: "resolution"; readonly value: Resolution; readonly [x: string]: unknown }
				| { readonly type: "ratio"; readonly value: Ratio; readonly [x: string]: unknown }
				| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
				| { readonly type: "env"; readonly value: EnvironmentVariable; readonly [x: string]: unknown };
			readonly [x: string]: unknown;
	  }
	| {
			readonly name:
				| "width"
				| "height"
				| "aspect-ratio"
				| "orientation"
				| "overflow-block"
				| "overflow-inline"
				| "horizontal-viewport-segments"
				| "vertical-viewport-segments"
				| "display-mode"
				| "resolution"
				| "scan"
				| "grid"
				| "update"
				| "environment-blending"
				| "color"
				| "color-index"
				| "monochrome"
				| "color-gamut"
				| "dynamic-range"
				| "inverted-colors"
				| "pointer"
				| "hover"
				| "any-pointer"
				| "any-hover"
				| "nav-controls"
				| "video-color-gamut"
				| "video-dynamic-range"
				| "scripting"
				| "prefers-reduced-motion"
				| "prefers-reduced-transparency"
				| "prefers-contrast"
				| "forced-colors"
				| "prefers-color-scheme"
				| "prefers-reduced-data"
				| "device-width"
				| "device-height"
				| "device-aspect-ratio"
				| "-webkit-device-pixel-ratio"
				| "-moz-device-pixel-ratio"
				| string;
			readonly type: "boolean";
			readonly [x: string]: unknown;
	  }
	| {
			readonly name:
				| "width"
				| "height"
				| "aspect-ratio"
				| "orientation"
				| "overflow-block"
				| "overflow-inline"
				| "horizontal-viewport-segments"
				| "vertical-viewport-segments"
				| "display-mode"
				| "resolution"
				| "scan"
				| "grid"
				| "update"
				| "environment-blending"
				| "color"
				| "color-index"
				| "monochrome"
				| "color-gamut"
				| "dynamic-range"
				| "inverted-colors"
				| "pointer"
				| "hover"
				| "any-pointer"
				| "any-hover"
				| "nav-controls"
				| "video-color-gamut"
				| "video-dynamic-range"
				| "scripting"
				| "prefers-reduced-motion"
				| "prefers-reduced-transparency"
				| "prefers-contrast"
				| "forced-colors"
				| "prefers-color-scheme"
				| "prefers-reduced-data"
				| "device-width"
				| "device-height"
				| "device-aspect-ratio"
				| "-webkit-device-pixel-ratio"
				| "-moz-device-pixel-ratio"
				| string;
			readonly operator: "equal" | "greater-than" | "greater-than-equal" | "less-than" | "less-than-equal";
			readonly type: "range";
			readonly value:
				| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown }
				| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "integer"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "boolean"; readonly value: boolean; readonly [x: string]: unknown }
				| { readonly type: "resolution"; readonly value: Resolution; readonly [x: string]: unknown }
				| { readonly type: "ratio"; readonly value: Ratio; readonly [x: string]: unknown }
				| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
				| { readonly type: "env"; readonly value: EnvironmentVariable; readonly [x: string]: unknown };
			readonly [x: string]: unknown;
	  }
	| {
			readonly end:
				| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown }
				| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "integer"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "boolean"; readonly value: boolean; readonly [x: string]: unknown }
				| { readonly type: "resolution"; readonly value: Resolution; readonly [x: string]: unknown }
				| { readonly type: "ratio"; readonly value: Ratio; readonly [x: string]: unknown }
				| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
				| { readonly type: "env"; readonly value: EnvironmentVariable; readonly [x: string]: unknown };
			readonly endOperator: "equal" | "greater-than" | "greater-than-equal" | "less-than" | "less-than-equal";
			readonly name:
				| "width"
				| "height"
				| "aspect-ratio"
				| "orientation"
				| "overflow-block"
				| "overflow-inline"
				| "horizontal-viewport-segments"
				| "vertical-viewport-segments"
				| "display-mode"
				| "resolution"
				| "scan"
				| "grid"
				| "update"
				| "environment-blending"
				| "color"
				| "color-index"
				| "monochrome"
				| "color-gamut"
				| "dynamic-range"
				| "inverted-colors"
				| "pointer"
				| "hover"
				| "any-pointer"
				| "any-hover"
				| "nav-controls"
				| "video-color-gamut"
				| "video-dynamic-range"
				| "scripting"
				| "prefers-reduced-motion"
				| "prefers-reduced-transparency"
				| "prefers-contrast"
				| "forced-colors"
				| "prefers-color-scheme"
				| "prefers-reduced-data"
				| "device-width"
				| "device-height"
				| "device-aspect-ratio"
				| "-webkit-device-pixel-ratio"
				| "-moz-device-pixel-ratio"
				| string;
			readonly start:
				| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown }
				| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "integer"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "boolean"; readonly value: boolean; readonly [x: string]: unknown }
				| { readonly type: "resolution"; readonly value: Resolution; readonly [x: string]: unknown }
				| { readonly type: "ratio"; readonly value: Ratio; readonly [x: string]: unknown }
				| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
				| { readonly type: "env"; readonly value: EnvironmentVariable; readonly [x: string]: unknown };
			readonly startOperator: "equal" | "greater-than" | "greater-than-equal" | "less-than" | "less-than-equal";
			readonly type: "interval";
			readonly [x: string]: unknown;
	  };

export type QueryFeature_for_ScrollStateFeatureId =
	| {
			readonly name: "stuck" | "snapped" | "scrollable" | "scrolled" | string;
			readonly type: "plain";
			readonly value:
				| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown }
				| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "integer"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "boolean"; readonly value: boolean; readonly [x: string]: unknown }
				| { readonly type: "resolution"; readonly value: Resolution; readonly [x: string]: unknown }
				| { readonly type: "ratio"; readonly value: Ratio; readonly [x: string]: unknown }
				| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
				| { readonly type: "env"; readonly value: EnvironmentVariable; readonly [x: string]: unknown };
			readonly [x: string]: unknown;
	  }
	| {
			readonly name: "stuck" | "snapped" | "scrollable" | "scrolled" | string;
			readonly type: "boolean";
			readonly [x: string]: unknown;
	  }
	| {
			readonly name: "stuck" | "snapped" | "scrollable" | "scrolled" | string;
			readonly operator: "equal" | "greater-than" | "greater-than-equal" | "less-than" | "less-than-equal";
			readonly type: "range";
			readonly value:
				| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown }
				| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "integer"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "boolean"; readonly value: boolean; readonly [x: string]: unknown }
				| { readonly type: "resolution"; readonly value: Resolution; readonly [x: string]: unknown }
				| { readonly type: "ratio"; readonly value: Ratio; readonly [x: string]: unknown }
				| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
				| { readonly type: "env"; readonly value: EnvironmentVariable; readonly [x: string]: unknown };
			readonly [x: string]: unknown;
	  }
	| {
			readonly end:
				| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown }
				| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "integer"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "boolean"; readonly value: boolean; readonly [x: string]: unknown }
				| { readonly type: "resolution"; readonly value: Resolution; readonly [x: string]: unknown }
				| { readonly type: "ratio"; readonly value: Ratio; readonly [x: string]: unknown }
				| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
				| { readonly type: "env"; readonly value: EnvironmentVariable; readonly [x: string]: unknown };
			readonly endOperator: "equal" | "greater-than" | "greater-than-equal" | "less-than" | "less-than-equal";
			readonly name: "stuck" | "snapped" | "scrollable" | "scrolled" | string;
			readonly start:
				| { readonly type: "length"; readonly value: Length; readonly [x: string]: unknown }
				| { readonly type: "number"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "integer"; readonly value: number; readonly [x: string]: unknown }
				| { readonly type: "boolean"; readonly value: boolean; readonly [x: string]: unknown }
				| { readonly type: "resolution"; readonly value: Resolution; readonly [x: string]: unknown }
				| { readonly type: "ratio"; readonly value: Ratio; readonly [x: string]: unknown }
				| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
				| { readonly type: "env"; readonly value: EnvironmentVariable; readonly [x: string]: unknown };
			readonly startOperator: "equal" | "greater-than" | "greater-than-equal" | "less-than" | "less-than-equal";
			readonly type: "interval";
			readonly [x: string]: unknown;
	  };

export type TrackListItem =
	| { readonly type: "track-size"; readonly value: TrackSize; readonly [x: string]: unknown }
	| { readonly type: "track-repeat"; readonly value: TrackRepeat; readonly [x: string]: unknown };

export type Symbol =
	| { readonly type: "string"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "image"; readonly value: Image; readonly [x: string]: unknown };

export type FontFaceProperty =
	| { readonly type: "source"; readonly value: ReadonlyArray<Source>; readonly [x: string]: unknown }
	| { readonly type: "font-family"; readonly value: FontFamily; readonly [x: string]: unknown }
	| { readonly type: "font-style"; readonly value: FontStyle2; readonly [x: string]: unknown }
	| { readonly type: "font-weight"; readonly value: Size2D_for_FontWeight; readonly [x: string]: unknown }
	| { readonly type: "font-stretch"; readonly value: Size2D_for_FontStretch; readonly [x: string]: unknown }
	| { readonly type: "unicode-range"; readonly value: ReadonlyArray<UnicodeRange>; readonly [x: string]: unknown }
	| { readonly type: "custom"; readonly value: CustomProperty; readonly [x: string]: unknown };

export type Grid = {
	readonly areas:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| {
				readonly areas: ReadonlyArray<string | null>;
				readonly columns: number;
				readonly type: "areas";
				readonly [x: string]: unknown;
		  };
	readonly autoColumns: ReadonlyArray<TrackSize>;
	readonly autoFlow: { readonly dense: boolean; readonly direction: "row" | "column"; readonly [x: string]: unknown };
	readonly autoRows: ReadonlyArray<TrackSize>;
	readonly columns:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| {
				readonly items: ReadonlyArray<TrackListItem>;
				readonly lineNames: ReadonlyArray<ReadonlyArray<String>>;
				readonly type: "track-list";
				readonly [x: string]: unknown;
		  };
	readonly rows:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| {
				readonly items: ReadonlyArray<TrackListItem>;
				readonly lineNames: ReadonlyArray<ReadonlyArray<String>>;
				readonly type: "track-list";
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type GridTemplate = {
	readonly areas:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| {
				readonly areas: ReadonlyArray<string | null>;
				readonly columns: number;
				readonly type: "areas";
				readonly [x: string]: unknown;
		  };
	readonly columns:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| {
				readonly items: ReadonlyArray<TrackListItem>;
				readonly lineNames: ReadonlyArray<ReadonlyArray<String>>;
				readonly type: "track-list";
				readonly [x: string]: unknown;
		  };
	readonly rows:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| {
				readonly items: ReadonlyArray<TrackListItem>;
				readonly lineNames: ReadonlyArray<ReadonlyArray<String>>;
				readonly type: "track-list";
				readonly [x: string]: unknown;
		  };
	readonly [x: string]: unknown;
};

export type TrackSizing =
	| { readonly type: "none"; readonly [x: string]: unknown }
	| {
			readonly items: ReadonlyArray<TrackListItem>;
			readonly lineNames: ReadonlyArray<ReadonlyArray<String>>;
			readonly type: "track-list";
			readonly [x: string]: unknown;
	  };

export type CounterStyle =
	| { readonly type: "predefined"; readonly value: PredefinedCounterStyle; readonly [x: string]: unknown }
	| { readonly type: "name"; readonly value: String; readonly [x: string]: unknown }
	| {
			readonly symbols: ReadonlyArray<Symbol>;
			readonly system?: "cyclic" | "numeric" | "alphabetic" | "symbolic" | "fixed";
			readonly type: "symbols";
			readonly [x: string]: unknown;
	  };

export type FontFaceRule = {
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly properties: ReadonlyArray<FontFaceProperty>;
	readonly [x: string]: unknown;
};

export type ListStyle = {
	readonly image:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| { readonly type: "url"; readonly value: Url; readonly [x: string]: unknown }
		| { readonly type: "gradient"; readonly value: Gradient; readonly [x: string]: unknown }
		| { readonly type: "image-set"; readonly value: ImageSet; readonly [x: string]: unknown };
	readonly listStyleType:
		| { readonly type: "none"; readonly [x: string]: unknown }
		| { readonly type: "string"; readonly value: String; readonly [x: string]: unknown }
		| { readonly type: "counter-style"; readonly value: CounterStyle; readonly [x: string]: unknown };
	readonly position: "inside" | "outside";
	readonly [x: string]: unknown;
};

export type ListStyleType =
	| { readonly type: "none"; readonly [x: string]: unknown }
	| { readonly type: "string"; readonly value: String; readonly [x: string]: unknown }
	| { readonly type: "counter-style"; readonly value: CounterStyle; readonly [x: string]: unknown };

export type Declaration =
	| { readonly property: "background-color"; readonly value: CssColor; readonly [x: string]: unknown }
	| { readonly property: "background-image"; readonly value: ReadonlyArray<Image>; readonly [x: string]: unknown }
	| {
			readonly property: "background-position-x";
			readonly value: ReadonlyArray<PositionComponent_for_HorizontalPositionKeyword>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "background-position-y";
			readonly value: ReadonlyArray<PositionComponent_for_VerticalPositionKeyword>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "background-position";
			readonly value: ReadonlyArray<BackgroundPosition>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "background-size";
			readonly value: ReadonlyArray<BackgroundSize>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "background-repeat";
			readonly value: ReadonlyArray<BackgroundRepeat>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "background-attachment";
			readonly value: ReadonlyArray<BackgroundAttachment>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "background-clip";
			readonly value: ReadonlyArray<BackgroundClip>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "background-origin";
			readonly value: ReadonlyArray<BackgroundOrigin>;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "background"; readonly value: ReadonlyArray<Background>; readonly [x: string]: unknown }
	| {
			readonly property: "box-shadow";
			readonly value: ReadonlyArray<BoxShadow>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "opacity"; readonly value: number; readonly [x: string]: unknown }
	| { readonly property: "color"; readonly value: CssColor; readonly [x: string]: unknown }
	| { readonly property: "display"; readonly value: Display; readonly [x: string]: unknown }
	| { readonly property: "visibility"; readonly value: Visibility; readonly [x: string]: unknown }
	| { readonly property: "width"; readonly value: Size; readonly [x: string]: unknown }
	| { readonly property: "height"; readonly value: Size; readonly [x: string]: unknown }
	| { readonly property: "min-width"; readonly value: Size; readonly [x: string]: unknown }
	| { readonly property: "min-height"; readonly value: Size; readonly [x: string]: unknown }
	| { readonly property: "max-width"; readonly value: MaxSize; readonly [x: string]: unknown }
	| { readonly property: "max-height"; readonly value: MaxSize; readonly [x: string]: unknown }
	| { readonly property: "block-size"; readonly value: Size; readonly [x: string]: unknown }
	| { readonly property: "inline-size"; readonly value: Size; readonly [x: string]: unknown }
	| { readonly property: "min-block-size"; readonly value: Size; readonly [x: string]: unknown }
	| { readonly property: "min-inline-size"; readonly value: Size; readonly [x: string]: unknown }
	| { readonly property: "max-block-size"; readonly value: MaxSize; readonly [x: string]: unknown }
	| { readonly property: "max-inline-size"; readonly value: MaxSize; readonly [x: string]: unknown }
	| {
			readonly property: "box-sizing";
			readonly value: BoxSizing;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "aspect-ratio"; readonly value: AspectRatio; readonly [x: string]: unknown }
	| { readonly property: "overflow"; readonly value: Overflow; readonly [x: string]: unknown }
	| { readonly property: "overflow-x"; readonly value: OverflowKeyword; readonly [x: string]: unknown }
	| { readonly property: "overflow-y"; readonly value: OverflowKeyword; readonly [x: string]: unknown }
	| {
			readonly property: "text-overflow";
			readonly value: TextOverflow;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "position"; readonly value: Position2; readonly [x: string]: unknown }
	| { readonly property: "top"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "bottom"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "left"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "right"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "inset-block-start"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "inset-block-end"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "inset-inline-start"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "inset-inline-end"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "inset-block"; readonly value: InsetBlock; readonly [x: string]: unknown }
	| { readonly property: "inset-inline"; readonly value: InsetInline; readonly [x: string]: unknown }
	| { readonly property: "inset"; readonly value: Inset; readonly [x: string]: unknown }
	| { readonly property: "border-spacing"; readonly value: Size2D_for_Length; readonly [x: string]: unknown }
	| { readonly property: "border-top-color"; readonly value: CssColor; readonly [x: string]: unknown }
	| { readonly property: "border-bottom-color"; readonly value: CssColor; readonly [x: string]: unknown }
	| { readonly property: "border-left-color"; readonly value: CssColor; readonly [x: string]: unknown }
	| { readonly property: "border-right-color"; readonly value: CssColor; readonly [x: string]: unknown }
	| { readonly property: "border-block-start-color"; readonly value: CssColor; readonly [x: string]: unknown }
	| { readonly property: "border-block-end-color"; readonly value: CssColor; readonly [x: string]: unknown }
	| { readonly property: "border-inline-start-color"; readonly value: CssColor; readonly [x: string]: unknown }
	| { readonly property: "border-inline-end-color"; readonly value: CssColor; readonly [x: string]: unknown }
	| { readonly property: "border-top-style"; readonly value: LineStyle; readonly [x: string]: unknown }
	| { readonly property: "border-bottom-style"; readonly value: LineStyle; readonly [x: string]: unknown }
	| { readonly property: "border-left-style"; readonly value: LineStyle; readonly [x: string]: unknown }
	| { readonly property: "border-right-style"; readonly value: LineStyle; readonly [x: string]: unknown }
	| { readonly property: "border-block-start-style"; readonly value: LineStyle; readonly [x: string]: unknown }
	| { readonly property: "border-block-end-style"; readonly value: LineStyle; readonly [x: string]: unknown }
	| { readonly property: "border-inline-start-style"; readonly value: LineStyle; readonly [x: string]: unknown }
	| { readonly property: "border-inline-end-style"; readonly value: LineStyle; readonly [x: string]: unknown }
	| { readonly property: "border-top-width"; readonly value: BorderSideWidth; readonly [x: string]: unknown }
	| { readonly property: "border-bottom-width"; readonly value: BorderSideWidth; readonly [x: string]: unknown }
	| { readonly property: "border-left-width"; readonly value: BorderSideWidth; readonly [x: string]: unknown }
	| { readonly property: "border-right-width"; readonly value: BorderSideWidth; readonly [x: string]: unknown }
	| { readonly property: "border-block-start-width"; readonly value: BorderSideWidth; readonly [x: string]: unknown }
	| { readonly property: "border-block-end-width"; readonly value: BorderSideWidth; readonly [x: string]: unknown }
	| { readonly property: "border-inline-start-width"; readonly value: BorderSideWidth; readonly [x: string]: unknown }
	| { readonly property: "border-inline-end-width"; readonly value: BorderSideWidth; readonly [x: string]: unknown }
	| {
			readonly property: "border-top-left-radius";
			readonly value: Size2D_for_DimensionPercentage_for_LengthValue;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-top-right-radius";
			readonly value: Size2D_for_DimensionPercentage_for_LengthValue;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-bottom-left-radius";
			readonly value: Size2D_for_DimensionPercentage_for_LengthValue;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-bottom-right-radius";
			readonly value: Size2D_for_DimensionPercentage_for_LengthValue;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-start-start-radius";
			readonly value: Size2D_for_DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-start-end-radius";
			readonly value: Size2D_for_DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-end-start-radius";
			readonly value: Size2D_for_DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-end-end-radius";
			readonly value: Size2D_for_DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-radius";
			readonly value: BorderRadius;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "border-image-source"; readonly value: Image; readonly [x: string]: unknown }
	| { readonly property: "border-image-outset"; readonly value: Rect_for_LengthOrNumber; readonly [x: string]: unknown }
	| { readonly property: "border-image-repeat"; readonly value: BorderImageRepeat; readonly [x: string]: unknown }
	| {
			readonly property: "border-image-width";
			readonly value: Rect_for_BorderImageSideWidth;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "border-image-slice"; readonly value: BorderImageSlice; readonly [x: string]: unknown }
	| {
			readonly property: "border-image";
			readonly value: BorderImage;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "border-color"; readonly value: BorderColor; readonly [x: string]: unknown }
	| { readonly property: "border-style"; readonly value: BorderStyle; readonly [x: string]: unknown }
	| { readonly property: "border-width"; readonly value: BorderWidth; readonly [x: string]: unknown }
	| { readonly property: "border-block-color"; readonly value: BorderBlockColor; readonly [x: string]: unknown }
	| { readonly property: "border-block-style"; readonly value: BorderBlockStyle; readonly [x: string]: unknown }
	| { readonly property: "border-block-width"; readonly value: BorderBlockWidth; readonly [x: string]: unknown }
	| { readonly property: "border-inline-color"; readonly value: BorderInlineColor; readonly [x: string]: unknown }
	| { readonly property: "border-inline-style"; readonly value: BorderInlineStyle; readonly [x: string]: unknown }
	| { readonly property: "border-inline-width"; readonly value: BorderInlineWidth; readonly [x: string]: unknown }
	| { readonly property: "border"; readonly value: GenericBorder_for_LineStyle_and_10; readonly [x: string]: unknown }
	| {
			readonly property: "border-top";
			readonly value: GenericBorder_for_LineStyle_and_0;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-bottom";
			readonly value: GenericBorder_for_LineStyle_and_2;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-left";
			readonly value: GenericBorder_for_LineStyle_and_3;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-right";
			readonly value: GenericBorder_for_LineStyle_and_1;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-block";
			readonly value: GenericBorder_for_LineStyle_and_8;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-block-start";
			readonly value: GenericBorder_for_LineStyle_and_4;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-block-end";
			readonly value: GenericBorder_for_LineStyle_and_5;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-inline";
			readonly value: GenericBorder_for_LineStyle_and_9;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-inline-start";
			readonly value: GenericBorder_for_LineStyle_and_6;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "border-inline-end";
			readonly value: GenericBorder_for_LineStyle_and_7;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "outline";
			readonly value: GenericBorder_for_OutlineStyle_and_11;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "outline-color"; readonly value: CssColor; readonly [x: string]: unknown }
	| { readonly property: "outline-style"; readonly value: OutlineStyle; readonly [x: string]: unknown }
	| { readonly property: "outline-width"; readonly value: BorderSideWidth; readonly [x: string]: unknown }
	| {
			readonly property: "flex-direction";
			readonly value: FlexDirection;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "flex-wrap";
			readonly value: FlexWrap;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "flex-flow";
			readonly value: FlexFlow;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "flex-grow";
			readonly value: number;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "flex-shrink";
			readonly value: number;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "flex-basis";
			readonly value: LengthPercentageOrAuto;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "flex";
			readonly value: Flex;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "order";
			readonly value: number;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "align-content";
			readonly value: AlignContent;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "justify-content";
			readonly value: JustifyContent;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "place-content"; readonly value: PlaceContent; readonly [x: string]: unknown }
	| {
			readonly property: "align-self";
			readonly value: AlignSelf;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "justify-self"; readonly value: JustifySelf; readonly [x: string]: unknown }
	| { readonly property: "place-self"; readonly value: PlaceSelf; readonly [x: string]: unknown }
	| {
			readonly property: "align-items";
			readonly value: AlignItems;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "justify-items"; readonly value: JustifyItems; readonly [x: string]: unknown }
	| { readonly property: "place-items"; readonly value: PlaceItems; readonly [x: string]: unknown }
	| { readonly property: "row-gap"; readonly value: GapValue; readonly [x: string]: unknown }
	| { readonly property: "column-gap"; readonly value: GapValue; readonly [x: string]: unknown }
	| { readonly property: "gap"; readonly value: Gap; readonly [x: string]: unknown }
	| {
			readonly property: "box-orient";
			readonly value: BoxOrient;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "box-direction";
			readonly value: BoxDirection;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "box-ordinal-group";
			readonly value: number;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "box-align";
			readonly value: BoxAlign;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "box-flex";
			readonly value: number;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "box-flex-group";
			readonly value: number;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "box-pack";
			readonly value: BoxPack;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "box-lines";
			readonly value: BoxLines;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "flex-pack";
			readonly value: FlexPack;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "flex-order";
			readonly value: number;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "flex-align";
			readonly value: BoxAlign;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "flex-item-align";
			readonly value: FlexItemAlign;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "flex-line-pack";
			readonly value: FlexLinePack;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "flex-positive";
			readonly value: number;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "flex-negative";
			readonly value: number;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "flex-preferred-size";
			readonly value: LengthPercentageOrAuto;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "grid-template-columns"; readonly value: TrackSizing; readonly [x: string]: unknown }
	| { readonly property: "grid-template-rows"; readonly value: TrackSizing; readonly [x: string]: unknown }
	| { readonly property: "grid-auto-columns"; readonly value: ReadonlyArray<TrackSize>; readonly [x: string]: unknown }
	| { readonly property: "grid-auto-rows"; readonly value: ReadonlyArray<TrackSize>; readonly [x: string]: unknown }
	| { readonly property: "grid-auto-flow"; readonly value: GridAutoFlow; readonly [x: string]: unknown }
	| { readonly property: "grid-template-areas"; readonly value: GridTemplateAreas; readonly [x: string]: unknown }
	| { readonly property: "grid-template"; readonly value: GridTemplate; readonly [x: string]: unknown }
	| { readonly property: "grid"; readonly value: Grid; readonly [x: string]: unknown }
	| { readonly property: "grid-row-start"; readonly value: GridLine; readonly [x: string]: unknown }
	| { readonly property: "grid-row-end"; readonly value: GridLine; readonly [x: string]: unknown }
	| { readonly property: "grid-column-start"; readonly value: GridLine; readonly [x: string]: unknown }
	| { readonly property: "grid-column-end"; readonly value: GridLine; readonly [x: string]: unknown }
	| { readonly property: "grid-row"; readonly value: GridRow; readonly [x: string]: unknown }
	| { readonly property: "grid-column"; readonly value: GridColumn; readonly [x: string]: unknown }
	| { readonly property: "grid-area"; readonly value: GridArea; readonly [x: string]: unknown }
	| { readonly property: "margin-top"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "margin-bottom"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "margin-left"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "margin-right"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "margin-block-start"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "margin-block-end"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "margin-inline-start"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "margin-inline-end"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "margin-block"; readonly value: MarginBlock; readonly [x: string]: unknown }
	| { readonly property: "margin-inline"; readonly value: MarginInline; readonly [x: string]: unknown }
	| { readonly property: "margin"; readonly value: Margin; readonly [x: string]: unknown }
	| { readonly property: "padding-top"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "padding-bottom"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "padding-left"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "padding-right"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "padding-block-start"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "padding-block-end"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "padding-inline-start"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "padding-inline-end"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "padding-block"; readonly value: PaddingBlock; readonly [x: string]: unknown }
	| { readonly property: "padding-inline"; readonly value: PaddingInline; readonly [x: string]: unknown }
	| { readonly property: "padding"; readonly value: Padding; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin-top"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin-bottom"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin-left"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin-right"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| {
			readonly property: "scroll-margin-block-start";
			readonly value: LengthPercentageOrAuto;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "scroll-margin-block-end";
			readonly value: LengthPercentageOrAuto;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "scroll-margin-inline-start";
			readonly value: LengthPercentageOrAuto;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "scroll-margin-inline-end";
			readonly value: LengthPercentageOrAuto;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "scroll-margin-block"; readonly value: ScrollMarginBlock; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin-inline"; readonly value: ScrollMarginInline; readonly [x: string]: unknown }
	| { readonly property: "scroll-margin"; readonly value: ScrollMargin; readonly [x: string]: unknown }
	| { readonly property: "scroll-padding-top"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| {
			readonly property: "scroll-padding-bottom";
			readonly value: LengthPercentageOrAuto;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "scroll-padding-left"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| { readonly property: "scroll-padding-right"; readonly value: LengthPercentageOrAuto; readonly [x: string]: unknown }
	| {
			readonly property: "scroll-padding-block-start";
			readonly value: LengthPercentageOrAuto;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "scroll-padding-block-end";
			readonly value: LengthPercentageOrAuto;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "scroll-padding-inline-start";
			readonly value: LengthPercentageOrAuto;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "scroll-padding-inline-end";
			readonly value: LengthPercentageOrAuto;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "scroll-padding-block"; readonly value: ScrollPaddingBlock; readonly [x: string]: unknown }
	| { readonly property: "scroll-padding-inline"; readonly value: ScrollPaddingInline; readonly [x: string]: unknown }
	| { readonly property: "scroll-padding"; readonly value: ScrollPadding; readonly [x: string]: unknown }
	| { readonly property: "font-weight"; readonly value: FontWeight; readonly [x: string]: unknown }
	| { readonly property: "font-size"; readonly value: FontSize; readonly [x: string]: unknown }
	| { readonly property: "font-stretch"; readonly value: FontStretch; readonly [x: string]: unknown }
	| { readonly property: "font-family"; readonly value: ReadonlyArray<FontFamily>; readonly [x: string]: unknown }
	| { readonly property: "font-style"; readonly value: FontStyle; readonly [x: string]: unknown }
	| { readonly property: "font-variant-caps"; readonly value: FontVariantCaps; readonly [x: string]: unknown }
	| { readonly property: "line-height"; readonly value: LineHeight; readonly [x: string]: unknown }
	| { readonly property: "font"; readonly value: Font; readonly [x: string]: unknown }
	| { readonly property: "vertical-align"; readonly value: VerticalAlign; readonly [x: string]: unknown }
	| { readonly property: "font-palette"; readonly value: DashedIdentReference; readonly [x: string]: unknown }
	| {
			readonly property: "transition-property";
			readonly value: ReadonlyArray<PropertyId>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "transition-duration";
			readonly value: ReadonlyArray<Time>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "transition-delay";
			readonly value: ReadonlyArray<Time>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "transition-timing-function";
			readonly value: ReadonlyArray<EasingFunction>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "transition";
			readonly value: ReadonlyArray<Transition>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "animation-name";
			readonly value: ReadonlyArray<AnimationName>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "animation-duration";
			readonly value: ReadonlyArray<Time>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "animation-timing-function";
			readonly value: ReadonlyArray<EasingFunction>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "animation-iteration-count";
			readonly value: ReadonlyArray<AnimationIterationCount>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "animation-direction";
			readonly value: ReadonlyArray<AnimationDirection>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "animation-play-state";
			readonly value: ReadonlyArray<AnimationPlayState>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "animation-delay";
			readonly value: ReadonlyArray<Time>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "animation-fill-mode";
			readonly value: ReadonlyArray<AnimationFillMode>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "animation-composition";
			readonly value: ReadonlyArray<AnimationComposition>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "animation-timeline";
			readonly value: ReadonlyArray<AnimationTimeline>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "animation-range-start";
			readonly value: ReadonlyArray<AnimationRangeStart>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "animation-range-end";
			readonly value: ReadonlyArray<AnimationRangeEnd>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "animation-range";
			readonly value: ReadonlyArray<AnimationRange>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "animation";
			readonly value: ReadonlyArray<Animation>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "transform";
			readonly value: ReadonlyArray<Transform>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "transform-origin";
			readonly value: Position;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "transform-style";
			readonly value: TransformStyle;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "transform-box"; readonly value: TransformBox; readonly [x: string]: unknown }
	| {
			readonly property: "backface-visibility";
			readonly value: BackfaceVisibility;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "perspective";
			readonly value: Perspective;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "perspective-origin";
			readonly value: Position;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "translate"; readonly value: Translate; readonly [x: string]: unknown }
	| { readonly property: "rotate"; readonly value: Rotate; readonly [x: string]: unknown }
	| { readonly property: "scale"; readonly value: Scale; readonly [x: string]: unknown }
	| { readonly property: "text-transform"; readonly value: TextTransform; readonly [x: string]: unknown }
	| { readonly property: "white-space"; readonly value: WhiteSpace; readonly [x: string]: unknown }
	| {
			readonly property: "tab-size";
			readonly value: LengthOrNumber;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "word-break"; readonly value: WordBreak; readonly [x: string]: unknown }
	| { readonly property: "line-break"; readonly value: LineBreak; readonly [x: string]: unknown }
	| {
			readonly property: "hyphens";
			readonly value: Hyphens;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "overflow-wrap"; readonly value: OverflowWrap; readonly [x: string]: unknown }
	| { readonly property: "word-wrap"; readonly value: OverflowWrap; readonly [x: string]: unknown }
	| { readonly property: "text-align"; readonly value: TextAlign; readonly [x: string]: unknown }
	| {
			readonly property: "text-align-last";
			readonly value: TextAlignLast;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "text-justify"; readonly value: TextJustify; readonly [x: string]: unknown }
	| { readonly property: "word-spacing"; readonly value: Spacing; readonly [x: string]: unknown }
	| { readonly property: "letter-spacing"; readonly value: Spacing; readonly [x: string]: unknown }
	| { readonly property: "text-indent"; readonly value: TextIndent; readonly [x: string]: unknown }
	| {
			readonly property: "text-decoration-line";
			readonly value: TextDecorationLine;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "text-decoration-style";
			readonly value: TextDecorationStyle;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "text-decoration-color";
			readonly value: CssColor;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "text-decoration-thickness";
			readonly value: TextDecorationThickness;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "text-decoration";
			readonly value: TextDecoration;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "text-decoration-skip-ink";
			readonly value: TextDecorationSkipInk;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "text-emphasis-style";
			readonly value: TextEmphasisStyle;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "text-emphasis-color";
			readonly value: CssColor;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "text-emphasis";
			readonly value: TextEmphasis;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "text-emphasis-position";
			readonly value: TextEmphasisPosition;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "text-shadow"; readonly value: ReadonlyArray<TextShadow>; readonly [x: string]: unknown }
	| {
			readonly property: "text-size-adjust";
			readonly value: TextSizeAdjust;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "direction"; readonly value: Direction2; readonly [x: string]: unknown }
	| { readonly property: "unicode-bidi"; readonly value: UnicodeBidi; readonly [x: string]: unknown }
	| {
			readonly property: "box-decoration-break";
			readonly value: BoxDecorationBreak;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "resize"; readonly value: Resize; readonly [x: string]: unknown }
	| { readonly property: "cursor"; readonly value: Cursor; readonly [x: string]: unknown }
	| { readonly property: "caret-color"; readonly value: ColorOrAuto; readonly [x: string]: unknown }
	| { readonly property: "caret-shape"; readonly value: CaretShape; readonly [x: string]: unknown }
	| { readonly property: "caret"; readonly value: Caret; readonly [x: string]: unknown }
	| {
			readonly property: "user-select";
			readonly value: UserSelect;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "accent-color"; readonly value: ColorOrAuto; readonly [x: string]: unknown }
	| {
			readonly property: "appearance";
			readonly value: Appearance;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "list-style-type"; readonly value: ListStyleType; readonly [x: string]: unknown }
	| { readonly property: "list-style-image"; readonly value: Image; readonly [x: string]: unknown }
	| { readonly property: "list-style-position"; readonly value: ListStylePosition; readonly [x: string]: unknown }
	| { readonly property: "list-style"; readonly value: ListStyle; readonly [x: string]: unknown }
	| { readonly property: "marker-side"; readonly value: MarkerSide; readonly [x: string]: unknown }
	| { readonly property: "composes"; readonly value: Composes; readonly [x: string]: unknown }
	| { readonly property: "fill"; readonly value: SVGPaint; readonly [x: string]: unknown }
	| { readonly property: "fill-rule"; readonly value: FillRule; readonly [x: string]: unknown }
	| { readonly property: "fill-opacity"; readonly value: number; readonly [x: string]: unknown }
	| { readonly property: "stroke"; readonly value: SVGPaint; readonly [x: string]: unknown }
	| { readonly property: "stroke-opacity"; readonly value: number; readonly [x: string]: unknown }
	| {
			readonly property: "stroke-width";
			readonly value: DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "stroke-linecap"; readonly value: StrokeLinecap; readonly [x: string]: unknown }
	| { readonly property: "stroke-linejoin"; readonly value: StrokeLinejoin; readonly [x: string]: unknown }
	| { readonly property: "stroke-miterlimit"; readonly value: number; readonly [x: string]: unknown }
	| { readonly property: "stroke-dasharray"; readonly value: StrokeDasharray; readonly [x: string]: unknown }
	| {
			readonly property: "stroke-dashoffset";
			readonly value: DimensionPercentage_for_LengthValue;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "marker-start"; readonly value: Marker; readonly [x: string]: unknown }
	| { readonly property: "marker-mid"; readonly value: Marker; readonly [x: string]: unknown }
	| { readonly property: "marker-end"; readonly value: Marker; readonly [x: string]: unknown }
	| { readonly property: "marker"; readonly value: Marker; readonly [x: string]: unknown }
	| { readonly property: "color-interpolation"; readonly value: ColorInterpolation; readonly [x: string]: unknown }
	| {
			readonly property: "color-interpolation-filters";
			readonly value: ColorInterpolation;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "color-rendering"; readonly value: ColorRendering; readonly [x: string]: unknown }
	| { readonly property: "shape-rendering"; readonly value: ShapeRendering; readonly [x: string]: unknown }
	| { readonly property: "text-rendering"; readonly value: TextRendering; readonly [x: string]: unknown }
	| { readonly property: "image-rendering"; readonly value: ImageRendering; readonly [x: string]: unknown }
	| {
			readonly property: "clip-path";
			readonly value: ClipPath;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "clip-rule"; readonly value: FillRule; readonly [x: string]: unknown }
	| {
			readonly property: "mask-image";
			readonly value: ReadonlyArray<Image>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "mask-mode"; readonly value: ReadonlyArray<MaskMode>; readonly [x: string]: unknown }
	| {
			readonly property: "mask-repeat";
			readonly value: ReadonlyArray<BackgroundRepeat>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "mask-position-x";
			readonly value: ReadonlyArray<PositionComponent_for_HorizontalPositionKeyword>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "mask-position-y";
			readonly value: ReadonlyArray<PositionComponent_for_VerticalPositionKeyword>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "mask-position";
			readonly value: ReadonlyArray<Position>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "mask-clip";
			readonly value: ReadonlyArray<MaskClip>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "mask-origin";
			readonly value: ReadonlyArray<GeometryBox>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "mask-size";
			readonly value: ReadonlyArray<BackgroundSize>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "mask-composite"; readonly value: ReadonlyArray<MaskComposite>; readonly [x: string]: unknown }
	| { readonly property: "mask-type"; readonly value: MaskType; readonly [x: string]: unknown }
	| {
			readonly property: "mask";
			readonly value: ReadonlyArray<Mask>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "mask-border-source"; readonly value: Image; readonly [x: string]: unknown }
	| { readonly property: "mask-border-mode"; readonly value: MaskBorderMode; readonly [x: string]: unknown }
	| { readonly property: "mask-border-slice"; readonly value: BorderImageSlice; readonly [x: string]: unknown }
	| {
			readonly property: "mask-border-width";
			readonly value: Rect_for_BorderImageSideWidth;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "mask-border-outset"; readonly value: Rect_for_LengthOrNumber; readonly [x: string]: unknown }
	| { readonly property: "mask-border-repeat"; readonly value: BorderImageRepeat; readonly [x: string]: unknown }
	| { readonly property: "mask-border"; readonly value: MaskBorder; readonly [x: string]: unknown }
	| {
			readonly property: "-webkit-mask-composite";
			readonly value: ReadonlyArray<WebKitMaskComposite>;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "mask-source-type";
			readonly value: ReadonlyArray<WebKitMaskSourceType>;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "mask-box-image";
			readonly value: BorderImage;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "mask-box-image-source";
			readonly value: Image;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "mask-box-image-slice";
			readonly value: BorderImageSlice;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "mask-box-image-width";
			readonly value: Rect_for_BorderImageSideWidth;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "mask-box-image-outset";
			readonly value: Rect_for_LengthOrNumber;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "mask-box-image-repeat";
			readonly value: BorderImageRepeat;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "filter";
			readonly value: FilterList;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| {
			readonly property: "backdrop-filter";
			readonly value: FilterList;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "mix-blend-mode"; readonly value: BlendMode; readonly [x: string]: unknown }
	| { readonly property: "z-index"; readonly value: ZIndex; readonly [x: string]: unknown }
	| { readonly property: "container-type"; readonly value: ContainerType; readonly [x: string]: unknown }
	| { readonly property: "container-name"; readonly value: ContainerNameList; readonly [x: string]: unknown }
	| { readonly property: "container"; readonly value: Container; readonly [x: string]: unknown }
	| { readonly property: "view-transition-name"; readonly value: ViewTransitionName; readonly [x: string]: unknown }
	| { readonly property: "view-transition-class"; readonly value: NoneOrCustomIdentList; readonly [x: string]: unknown }
	| { readonly property: "view-transition-group"; readonly value: ViewTransitionGroup; readonly [x: string]: unknown }
	| { readonly property: "color-scheme"; readonly value: ColorScheme; readonly [x: string]: unknown }
	| {
			readonly property: "print-color-adjust";
			readonly value: PrintColorAdjust;
			readonly vendorPrefix: VendorPrefix;
			readonly [x: string]: unknown;
	  }
	| { readonly property: "all"; readonly value: CSSWideKeyword; readonly [x: string]: unknown }
	| { readonly property: "unparsed"; readonly value: UnparsedProperty; readonly [x: string]: unknown }
	| { readonly property: "custom"; readonly value: CustomProperty; readonly [x: string]: unknown };

export type CounterStyleRule = {
	readonly declarations: {
		readonly declarations?: ReadonlyArray<Declaration>;
		readonly importantDeclarations?: ReadonlyArray<Declaration>;
		readonly [x: string]: unknown;
	};
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly name: string;
	readonly [x: string]: unknown;
};

export type Keyframe = {
	readonly declarations: {
		readonly declarations?: ReadonlyArray<Declaration>;
		readonly importantDeclarations?: ReadonlyArray<Declaration>;
		readonly [x: string]: unknown;
	};
	readonly selectors: ReadonlyArray<KeyframeSelector>;
	readonly [x: string]: unknown;
};

export type NestedDeclarationsRule = {
	readonly declarations: {
		readonly declarations?: ReadonlyArray<Declaration>;
		readonly importantDeclarations?: ReadonlyArray<Declaration>;
		readonly [x: string]: unknown;
	};
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly [x: string]: unknown;
};

export type PageMarginRule = {
	readonly declarations: {
		readonly declarations?: ReadonlyArray<Declaration>;
		readonly importantDeclarations?: ReadonlyArray<Declaration>;
		readonly [x: string]: unknown;
	};
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly marginBox:
		| "top-left-corner"
		| "top-left"
		| "top-center"
		| "top-right"
		| "top-right-corner"
		| "left-top"
		| "left-middle"
		| "left-bottom"
		| "right-top"
		| "right-middle"
		| "right-bottom"
		| "bottom-left-corner"
		| "bottom-left"
		| "bottom-center"
		| "bottom-right"
		| "bottom-right-corner";
	readonly [x: string]: unknown;
};

export type ViewportRule = {
	readonly declarations: {
		readonly declarations?: ReadonlyArray<Declaration>;
		readonly importantDeclarations?: ReadonlyArray<Declaration>;
		readonly [x: string]: unknown;
	};
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly vendorPrefix: ReadonlyArray<Prefix>;
	readonly [x: string]: unknown;
};

export type KeyframesRule = {
	readonly keyframes: ReadonlyArray<Keyframe>;
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly name:
		| { readonly type: "ident"; readonly value: String; readonly [x: string]: unknown }
		| { readonly type: "custom"; readonly value: String; readonly [x: string]: unknown };
	readonly vendorPrefix: ReadonlyArray<Prefix>;
	readonly [x: string]: unknown;
};

export type PageRule = {
	readonly declarations: {
		readonly declarations?: ReadonlyArray<Declaration>;
		readonly importantDeclarations?: ReadonlyArray<Declaration>;
		readonly [x: string]: unknown;
	};
	readonly loc: {
		readonly column: number;
		readonly line: number;
		readonly source_index: number;
		readonly [x: string]: unknown;
	};
	readonly rules: ReadonlyArray<PageMarginRule>;
	readonly selectors: ReadonlyArray<PageSelector>;
	readonly [x: string]: unknown;
};

export type StyleSheet = {
	readonly licenseComments: ReadonlyArray<String>;
	readonly rules: ReadonlyArray<Rule>;
	readonly sourceMapUrls: ReadonlyArray<string | null>;
	readonly sources: ReadonlyArray<string>;
	readonly [x: string]: unknown;
};
