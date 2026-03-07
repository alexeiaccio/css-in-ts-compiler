import bcd from "@mdn/browser-compat-data" with { type: "json" };
import webref from "@webref/css/css.json" with { type: "json" };
import { Data, Effect, Schema } from "effect";

import { type CompatData, CSSCompatData } from "./bcd-schema";
import { type WebrefAtRule, WebrefCSSData, type WebrefProperty, type WebrefType } from "./webref-schema";

class DecodeError extends Data.TaggedError("DecodeError")<{
	readonly source: string;
	readonly reason: string;
}> {}

const normalizeAtRuleKey = (name: string): string => {
	return name.startsWith("@") ? name.slice(1) : name;
};

const filterSupport = (support: Record<string, unknown> | undefined): Record<string, boolean> | undefined => {
	if (!support) return undefined;

	const browsers = ["chrome", "firefox", "safari"] as const;
	const filtered: Record<string, boolean> = {};

	for (const browser of browsers) {
		if (support[browser] !== undefined) {
			const value = support[browser];
			if (typeof value === "boolean") {
				filtered[browser] = value;
			} else if (typeof value === "object" && value !== null && "version_added" in value) {
				filtered[browser] = (value as { version_added: string | boolean }).version_added !== false;
			}
		}
	}

	return Object.keys(filtered).length > 0 ? filtered : undefined;
};

const filterCompat = (compat: CompatData | undefined): CompatData | undefined => {
	if (!compat) return undefined;
	if (compat.status?.deprecated === true) return undefined;

	const filteredSupport: Record<string, boolean | unknown> = {};
	if (compat.support) {
		for (const [browser, value] of Object.entries(compat.support)) {
			if (browser === "chrome" || browser === "firefox" || browser === "safari") {
				if (typeof value === "boolean") {
					filteredSupport[browser] = value;
				} else if (typeof value === "object" && value !== null && "version_added" in value) {
					filteredSupport[browser] = (value as { version_added: string | boolean }).version_added;
				}
			}
		}
	}

	return Object.keys(filteredSupport).length > 0
		? { ...compat, support: filteredSupport as CompatData["support"] }
		: undefined;
};

type AtRuleWithCompat = WebrefAtRule & { __compat: CompatData | undefined };
type PropertyWithCompat = WebrefProperty & { __compat: CompatData | undefined };
type TypeWithCompat = WebrefType & { __compat: CompatData | undefined };

const mergeAtRules = (
	bcdAtRules: CSSCompatData["at-rules"],
	webrefAtRules: WebrefCSSData["atrules"],
): Record<string, AtRuleWithCompat> => {
	const result: Record<string, AtRuleWithCompat> = {};

	for (const item of webrefAtRules) {
		const bcdKey = normalizeAtRuleKey(item.name);
		const compat = bcdAtRules?.[bcdKey];
		const filteredCompat = filterCompat(compat?.__compat);

		if (filteredCompat) {
			result[item.name] = {
				...item,
				__compat: filteredCompat,
			};
		}
	}

	return result;
};

const mergeProperties = (
	bcdProperties: CSSCompatData["properties"],
	webrefProperties: WebrefCSSData["properties"],
): Record<string, PropertyWithCompat> => {
	const result: Record<string, PropertyWithCompat> = {};

	for (const item of webrefProperties) {
		const compatKey = item.legacyAliasOf || item.name;
		const compat = bcdProperties?.[compatKey];
		const filteredCompat = filterCompat(compat?.__compat);

		if (filteredCompat) {
			result[item.name] = {
				...item,
				__compat: filteredCompat,
			};
		}
	}

	return result;
};

type BCDOnlyType = {
	readonly name: string;
	readonly __compat: CompatData;
};

const extractBCDTypes = (bcdTypes: CSSCompatData["types"]): Record<string, BCDOnlyType> => {
	const result: Record<string, BCDOnlyType> = {};

	if (!bcdTypes) return result;

	for (const [typeName, typeData] of Object.entries(bcdTypes)) {
		if (typeName === "__compat") continue;

		const filteredCompat = filterCompat(typeData.__compat);
		if (filteredCompat) {
			result[typeName] = {
				name: typeName,
				__compat: filteredCompat,
			};
		}

		for (const [subType, subData] of Object.entries(typeData)) {
			if (subType === "__compat") continue;
			if (typeof subData !== "object" || subData === null) continue;
			if (!("__compat" in subData)) continue;

			const subCompat = filterCompat((subData as { __compat?: CompatData }).__compat);
			if (subCompat) {
				result[subType] = {
					name: subType,
					__compat: subCompat,
				};
			}
		}
	}

	return result;
};

const mergeTypes = (
	bcdTypes: CSSCompatData["types"],
	webrefTypes: WebrefCSSData["types"],
): Record<string, TypeWithCompat> => {
	const result: Record<string, TypeWithCompat> = {};
	const bcdTypesRecord = bcdTypes as Record<string, { __compat?: CompatData }> | undefined;

	for (const item of webrefTypes) {
		const compat = bcdTypesRecord?.[item.name];
		const filteredCompat = filterCompat(compat?.__compat);

		if (filteredCompat) {
			result[item.name] = {
				...item,
				__compat: filteredCompat,
			};
		}
	}

	return result;
};

const parseData = Effect.gen(function* () {
	const bcdCSS = yield* Effect.try({
		try: () => Schema.decodeUnknownSync(CSSCompatData)(bcd.css),
		catch: (reason) =>
			new DecodeError({
				source: "@mdn/browser-compat-data",
				reason: reason instanceof Error ? reason.message : "Unknown error",
			}),
	});

	const webrefCSS = yield* Effect.try({
		try: () => Schema.decodeUnknownSync(WebrefCSSData)(webref),
		catch: (reason) =>
			new DecodeError({
				source: "@webref/css",
				reason: reason instanceof Error ? reason.message : "Unknown error",
			}),
	});

	return {
		atrules: mergeAtRules(bcdCSS["at-rules"], webrefCSS.atrules),
		properties: mergeProperties(bcdCSS.properties, webrefCSS.properties),
		selectors: bcdCSS.selectors,
		types: {
			...mergeTypes(bcdCSS.types, webrefCSS.types),
			...extractBCDTypes(bcdCSS.types),
		},
	};
});

if (import.meta.vitest) {
	const { it, expect, describe } = import.meta.vitest;
	describe("css-data", () => {
		it("works", async () => {
			const data = await Effect.runPromise(parseData);

			expect(data.atrules).toBeDefined();
			expect(data.properties).toBeDefined();
			expect(data.selectors).toBeDefined();
			expect(Object.keys(data.types)).toMatchInlineSnapshot(`
				[
				  "anchor-size",
				  "angle",
				  "angle-percentage",
				  "basic-shape",
				  "blend-mode",
				  "calc-keyword",
				  "color",
				  "corner-shape-value",
				  "counter",
				  "dashed-function",
				  "dimension",
				  "easing-function",
				  "filter-function",
				  "flex",
				  "gradient",
				  "image",
				  "integer",
				  "length",
				  "length-percentage",
				  "line-style",
				  "number",
				  "percentage",
				  "position",
				  "ratio",
				  "resolution",
				  "string",
				  "text-edge",
				  "time",
				  "transform-function",
				  "type",
				  "url",
				  "abs",
				  "acos",
				  "anchor",
				  "inset_margin",
				  "deg",
				  "grad",
				  "rad",
				  "turn",
				  "asin",
				  "atan",
				  "atan2",
				  "attr",
				  "declaration-value",
				  "type_function",
				  "animation",
				  "circle",
				  "ellipse",
				  "inset",
				  "path",
				  "polygon",
				  "rect",
				  "shape",
				  "xywh",
				  "color_component",
				  "gradient_color_stops",
				  "nested",
				  "number_values",
				  "typed_division_produces_unitless_number",
				  "NaN",
				  "e",
				  "infinity",
				  "pi",
				  "calc-size",
				  "clamp",
				  "color-mix",
				  "contrast-color",
				  "currentcolor",
				  "hsl",
				  "hwb",
				  "lab",
				  "lch",
				  "light-dark",
				  "named-color",
				  "oklab",
				  "oklch",
				  "rgb",
				  "rgb_hexadecimal_notation",
				  "system-color",
				  "transparent",
				  "bevel",
				  "notch",
				  "round",
				  "scoop",
				  "square",
				  "squircle",
				  "superellipse",
				  "cos",
				  "counters",
				  "dynamic-range-limit-mix",
				  "cubic-bezier",
				  "linear-function",
				  "steps",
				  "env",
				  "keyboard-inset-bottom",
				  "keyboard-inset-height",
				  "keyboard-inset-left",
				  "keyboard-inset-right",
				  "keyboard-inset-top",
				  "keyboard-inset-width",
				  "safe-area-inset-bottom",
				  "safe-area-inset-left",
				  "safe-area-inset-right",
				  "safe-area-inset-top",
				  "titlebar-area-height",
				  "titlebar-area-width",
				  "titlebar-area-x",
				  "titlebar-area-y",
				  "viewport-segment-bottom",
				  "viewport-segment-height",
				  "viewport-segment-left",
				  "viewport-segment-right",
				  "viewport-segment-top",
				  "viewport-segment-width",
				  "exp",
				  "blur",
				  "brightness",
				  "contrast",
				  "drop-shadow",
				  "grayscale",
				  "hue-rotate",
				  "invert",
				  "opacity",
				  "saturate",
				  "sepia",
				  "global_keywords",
				  "inherit",
				  "initial",
				  "revert",
				  "revert-layer",
				  "unset",
				  "conic-gradient",
				  "repeating-conic-gradient",
				  "hypot",
				  "if",
				  "style",
				  "cross-fade",
				  "element",
				  "filter",
				  "paint",
				  "Q",
				  "cap",
				  "ch",
				  "container_query_length_units",
				  "em",
				  "ex",
				  "ic",
				  "lh",
				  "rcap",
				  "rch",
				  "rem",
				  "rex",
				  "ric",
				  "rlh",
				  "vb",
				  "vh",
				  "vi",
				  "viewport_percentage_units_dynamic",
				  "viewport_percentage_units_large",
				  "viewport_percentage_units_small",
				  "vmax",
				  "vmin",
				  "vw",
				  "log",
				  "max",
				  "min",
				  "mod",
				  "mixed_type_parameters",
				  "scientific_notation",
				  "overflow",
				  "clip",
				  "four_value_syntax",
				  "keyword_value_syntax",
				  "pow",
				  "progress",
				  "random",
				  "number_value",
				  "ray",
				  "size",
				  "dpcm",
				  "dpi",
				  "dppx",
				  "x",
				  "sibling-count",
				  "sibling-index",
				  "sign",
				  "sin",
				  "sqrt",
				  "unicode_escaped_characters",
				  "tan",
				  "alphabetic",
				  "text",
				  "matrix",
				  "matrix3d",
				  "perspective",
				  "rotate",
				  "rotate3d",
				  "rotateX",
				  "rotateY",
				  "rotateZ",
				  "scale",
				  "scale3d",
				  "scaleX",
				  "scaleY",
				  "scaleZ",
				  "skew",
				  "skewX",
				  "skewY",
				  "translate",
				  "translate3d",
				  "translateX",
				  "translateY",
				  "translateZ",
				  "var",
				]
			`);
			expect(bcd.css.types?.length).toMatchInlineSnapshot(`
				{
				  "Q": {
				    "__compat": {
				      "description": "<code>Q</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "63",
				        },
				        "chrome_android": {
				          "version_added": "63",
				        },
				        "edge": {
				          "version_added": "79",
				        },
				        "firefox": {
				          "version_added": "49",
				        },
				        "firefox_android": {
				          "version_added": "49",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "50",
				        },
				        "opera_android": {
				          "version_added": "46",
				        },
				        "safari": {
				          "version_added": "13.1",
				        },
				        "safari_ios": {
				          "version_added": "13.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "8.0",
				        },
				        "webview_android": {
				          "version_added": "63",
				        },
				        "webview_ios": {
				          "version_added": "13.4",
				        },
				      },
				      "tags": [
				        "web-features:q-unit",
				      ],
				    },
				  },
				  "__compat": {
				    "description": "<code>&lt;length&gt;</code>",
				    "mdn_url": "https://developer.mozilla.org/docs/Web/CSS/Reference/Values/length",
				    "source_file": "css/types/length.json",
				    "spec_url": "https://drafts.csswg.org/css-values/#lengths",
				    "status": {
				      "deprecated": false,
				      "experimental": false,
				      "standard_track": true,
				    },
				    "support": {
				      "chrome": {
				        "version_added": "1",
				      },
				      "chrome_android": {
				        "version_added": "18",
				      },
				      "edge": {
				        "version_added": "12",
				      },
				      "firefox": {
				        "version_added": "1",
				      },
				      "firefox_android": {
				        "version_added": "4",
				      },
				      "ie": {
				        "version_added": "3",
				      },
				      "oculus": {
				        "version_added": "5.0",
				      },
				      "opera": {
				        "version_added": "3.5",
				      },
				      "opera_android": {
				        "version_added": "10.1",
				      },
				      "safari": {
				        "version_added": "1",
				      },
				      "safari_ios": {
				        "version_added": "1",
				      },
				      "samsunginternet_android": {
				        "version_added": "1.0",
				      },
				      "webview_android": {
				        "version_added": "1",
				      },
				      "webview_ios": {
				        "version_added": "1",
				      },
				    },
				    "tags": [
				      "web-features:width-height",
				    ],
				  },
				  "cap": {
				    "__compat": {
				      "description": "<code>cap</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "118",
				        },
				        "chrome_android": {
				          "version_added": "118",
				        },
				        "edge": {
				          "version_added": "118",
				        },
				        "firefox": {
				          "version_added": "97",
				        },
				        "firefox_android": {
				          "version_added": "97",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "104",
				        },
				        "opera_android": {
				          "version_added": "79",
				        },
				        "safari": {
				          "version_added": "17.2",
				        },
				        "safari_ios": {
				          "version_added": "17.2",
				        },
				        "samsunginternet_android": {
				          "version_added": "25.0",
				        },
				        "webview_android": {
				          "version_added": "118",
				        },
				        "webview_ios": {
				          "version_added": "17.2",
				        },
				      },
				      "tags": [
				        "web-features:cap",
				      ],
				    },
				  },
				  "ch": {
				    "__compat": {
				      "description": "<code>ch</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "27",
				        },
				        "chrome_android": {
				          "version_added": "27",
				        },
				        "edge": {
				          "version_added": "12",
				        },
				        "firefox": {
				          "notes": [
				            "From Firefox 1 to Firefox 3, <code>ch</code> was the width of the <em>M</em> character.",
				            "From Firefox 1 to Firefox 3, <code>ch</code> did not work with <a href="https://developer.mozilla.org/docs/Web/CSS/border-width"><code>border-width</code></a> and <a href="https://developer.mozilla.org/docs/Web/CSS/outline-width"><code>outline-width</code></a> CSS properties.",
				          ],
				          "version_added": "1",
				        },
				        "firefox_android": {
				          "version_added": "4",
				        },
				        "ie": {
				          "version_added": "9",
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "15",
				        },
				        "opera_android": {
				          "version_added": "15",
				        },
				        "safari": {
				          "version_added": "7",
				        },
				        "safari_ios": {
				          "version_added": "7",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.5",
				        },
				        "webview_android": {
				          "version_added": "4.4",
				        },
				        "webview_ios": {
				          "version_added": "7",
				        },
				      },
				      "tags": [
				        "web-features:ch",
				      ],
				    },
				  },
				  "container_query_length_units": {
				    "__compat": {
				      "description": "Container query length units <code>cqw</code>, <code>cqh</code>, <code>cqi</code>, <code>cqb</code>, <code>cqmin</code>, <code>cqmax</code>",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "105",
				        },
				        "chrome_android": {
				          "version_added": "105",
				        },
				        "edge": {
				          "version_added": "105",
				        },
				        "firefox": {
				          "version_added": "110",
				        },
				        "firefox_android": {
				          "version_added": "110",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "91",
				        },
				        "opera_android": {
				          "version_added": "72",
				        },
				        "safari": {
				          "version_added": "16",
				        },
				        "safari_ios": {
				          "version_added": "16",
				        },
				        "samsunginternet_android": {
				          "version_added": "20.0",
				        },
				        "webview_android": {
				          "version_added": "105",
				        },
				        "webview_ios": {
				          "version_added": "16",
				        },
				      },
				      "tags": [
				        "web-features:container-queries",
				      ],
				    },
				  },
				  "em": {
				    "__compat": {
				      "description": "<code>em</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "1",
				        },
				        "chrome_android": {
				          "version_added": "18",
				        },
				        "edge": {
				          "version_added": "12",
				        },
				        "firefox": {
				          "version_added": "1",
				        },
				        "firefox_android": {
				          "version_added": "4",
				        },
				        "ie": {
				          "version_added": "3",
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "3.5",
				        },
				        "opera_android": {
				          "version_added": "10.1",
				        },
				        "safari": {
				          "version_added": "1",
				        },
				        "safari_ios": {
				          "version_added": "1",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.0",
				        },
				        "webview_android": {
				          "version_added": "1",
				        },
				        "webview_ios": {
				          "version_added": "1",
				        },
				      },
				      "tags": [
				        "web-features:em-unit",
				      ],
				    },
				  },
				  "ex": {
				    "__compat": {
				      "description": "<code>ex</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "1",
				        },
				        "chrome_android": {
				          "version_added": "18",
				        },
				        "edge": {
				          "version_added": "12",
				        },
				        "firefox": {
				          "version_added": "1",
				        },
				        "firefox_android": {
				          "version_added": "4",
				        },
				        "ie": {
				          "version_added": "4",
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "3.5",
				        },
				        "opera_android": {
				          "version_added": "10.1",
				        },
				        "safari": {
				          "version_added": "1",
				        },
				        "safari_ios": {
				          "version_added": "1",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.0",
				        },
				        "webview_android": {
				          "version_added": "4.4",
				        },
				        "webview_ios": {
				          "version_added": "1",
				        },
				      },
				      "tags": [
				        "web-features:ex",
				      ],
				    },
				  },
				  "ic": {
				    "__compat": {
				      "description": "<code>ic</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "106",
				        },
				        "chrome_android": {
				          "version_added": "106",
				        },
				        "edge": {
				          "version_added": "106",
				        },
				        "firefox": {
				          "version_added": "97",
				        },
				        "firefox_android": {
				          "version_added": "97",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "92",
				        },
				        "opera_android": {
				          "version_added": "72",
				        },
				        "safari": {
				          "version_added": "15.4",
				        },
				        "safari_ios": {
				          "version_added": "15.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "20.0",
				        },
				        "webview_android": {
				          "version_added": "106",
				        },
				        "webview_ios": {
				          "version_added": "15.4",
				        },
				      },
				      "tags": [
				        "web-features:ic",
				      ],
				    },
				  },
				  "lh": {
				    "__compat": {
				      "description": "<code>lh</code> unit",
				      "source_file": "css/types/length.json",
				      "spec_url": "https://drafts.csswg.org/css-values/#lh",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "109",
				        },
				        "chrome_android": {
				          "version_added": "109",
				        },
				        "edge": {
				          "version_added": "109",
				        },
				        "firefox": {
				          "version_added": "120",
				        },
				        "firefox_android": {
				          "version_added": "120",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "95",
				        },
				        "opera_android": {
				          "version_added": "74",
				        },
				        "safari": {
				          "version_added": "16.4",
				        },
				        "safari_ios": {
				          "version_added": "16.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "21.0",
				        },
				        "webview_android": {
				          "version_added": "109",
				        },
				        "webview_ios": {
				          "version_added": "16.4",
				        },
				      },
				      "tags": [
				        "web-features:lh",
				      ],
				    },
				  },
				  "rcap": {
				    "__compat": {
				      "description": "<code>rcap</code> unit",
				      "source_file": "css/types/length.json",
				      "spec_url": "https://drafts.csswg.org/css-values/#rcap",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "118",
				        },
				        "chrome_android": {
				          "version_added": "118",
				        },
				        "edge": {
				          "version_added": "118",
				        },
				        "firefox": {
				          "version_added": "147",
				        },
				        "firefox_android": {
				          "version_added": "147",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "104",
				        },
				        "opera_android": {
				          "version_added": "79",
				        },
				        "safari": {
				          "version_added": "17.2",
				        },
				        "safari_ios": {
				          "version_added": "17.2",
				        },
				        "samsunginternet_android": {
				          "version_added": "25.0",
				        },
				        "webview_android": {
				          "version_added": "118",
				        },
				        "webview_ios": {
				          "version_added": "17.2",
				        },
				      },
				      "tags": [
				        "web-features:rcap",
				      ],
				    },
				  },
				  "rch": {
				    "__compat": {
				      "description": "<code>rch</code> unit",
				      "source_file": "css/types/length.json",
				      "spec_url": "https://drafts.csswg.org/css-values/#rch",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "111",
				        },
				        "chrome_android": {
				          "version_added": "111",
				        },
				        "edge": {
				          "version_added": "111",
				        },
				        "firefox": {
				          "version_added": "147",
				        },
				        "firefox_android": {
				          "version_added": "147",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "97",
				        },
				        "opera_android": {
				          "version_added": "75",
				        },
				        "safari": {
				          "version_added": "17.2",
				        },
				        "safari_ios": {
				          "version_added": "17.2",
				        },
				        "samsunginternet_android": {
				          "version_added": "22.0",
				        },
				        "webview_android": {
				          "version_added": "111",
				        },
				        "webview_ios": {
				          "version_added": "17.2",
				        },
				      },
				      "tags": [
				        "web-features:rch",
				      ],
				    },
				  },
				  "rem": {
				    "__compat": {
				      "description": "<code>rem</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "4",
				        },
				        "chrome_android": {
				          "version_added": "18",
				        },
				        "edge": {
				          "version_added": "12",
				        },
				        "firefox": {
				          "version_added": "3.6",
				        },
				        "firefox_android": {
				          "version_added": "4",
				        },
				        "ie": {
				          "version_added": "9",
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "11.6",
				        },
				        "opera_android": {
				          "version_added": "12",
				        },
				        "safari": {
				          "version_added": "5",
				        },
				        "safari_ios": {
				          "version_added": "4",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.0",
				        },
				        "webview_android": {
				          "version_added": "2",
				        },
				        "webview_ios": {
				          "version_added": "4",
				        },
				      },
				      "tags": [
				        "web-features:rem",
				      ],
				    },
				  },
				  "rex": {
				    "__compat": {
				      "description": "<code>rex</code> unit",
				      "source_file": "css/types/length.json",
				      "spec_url": "https://drafts.csswg.org/css-values/#rex",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "111",
				        },
				        "chrome_android": {
				          "version_added": "111",
				        },
				        "edge": {
				          "version_added": "111",
				        },
				        "firefox": {
				          "version_added": "147",
				        },
				        "firefox_android": {
				          "version_added": "147",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "97",
				        },
				        "opera_android": {
				          "version_added": "75",
				        },
				        "safari": {
				          "version_added": "17.2",
				        },
				        "safari_ios": {
				          "version_added": "17.2",
				        },
				        "samsunginternet_android": {
				          "version_added": "22.0",
				        },
				        "webview_android": {
				          "version_added": "111",
				        },
				        "webview_ios": {
				          "version_added": "17.2",
				        },
				      },
				      "tags": [
				        "web-features:rex",
				      ],
				    },
				  },
				  "ric": {
				    "__compat": {
				      "description": "<code>ric</code> unit",
				      "source_file": "css/types/length.json",
				      "spec_url": "https://drafts.csswg.org/css-values/#ric",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "111",
				        },
				        "chrome_android": {
				          "version_added": "111",
				        },
				        "edge": {
				          "version_added": "111",
				        },
				        "firefox": {
				          "version_added": "147",
				        },
				        "firefox_android": {
				          "version_added": "147",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "97",
				        },
				        "opera_android": {
				          "version_added": "75",
				        },
				        "safari": {
				          "version_added": "17.2",
				        },
				        "safari_ios": {
				          "version_added": "17.2",
				        },
				        "samsunginternet_android": {
				          "version_added": "22.0",
				        },
				        "webview_android": {
				          "version_added": "111",
				        },
				        "webview_ios": {
				          "version_added": "17.2",
				        },
				      },
				      "tags": [
				        "web-features:ric",
				      ],
				    },
				  },
				  "rlh": {
				    "__compat": {
				      "description": "<code>rlh</code> unit",
				      "source_file": "css/types/length.json",
				      "spec_url": "https://drafts.csswg.org/css-values/#rlh",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "111",
				        },
				        "chrome_android": {
				          "version_added": "111",
				        },
				        "edge": {
				          "version_added": "111",
				        },
				        "firefox": {
				          "version_added": "120",
				        },
				        "firefox_android": {
				          "version_added": "120",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "97",
				        },
				        "opera_android": {
				          "version_added": "75",
				        },
				        "safari": {
				          "version_added": "16.4",
				        },
				        "safari_ios": {
				          "version_added": "16.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "22.0",
				        },
				        "webview_android": {
				          "version_added": "111",
				        },
				        "webview_ios": {
				          "version_added": "16.4",
				        },
				      },
				      "tags": [
				        "web-features:rlh",
				      ],
				    },
				  },
				  "vb": {
				    "__compat": {
				      "description": "<code>vb</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "108",
				        },
				        "chrome_android": {
				          "version_added": "108",
				        },
				        "edge": {
				          "version_added": "108",
				        },
				        "firefox": {
				          "version_added": "101",
				        },
				        "firefox_android": {
				          "version_added": "101",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "94",
				        },
				        "opera_android": {
				          "version_added": "73",
				        },
				        "safari": {
				          "version_added": "15.4",
				        },
				        "safari_ios": {
				          "version_added": "15.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "21.0",
				        },
				        "webview_android": {
				          "version_added": "108",
				        },
				        "webview_ios": {
				          "version_added": "15.4",
				        },
				      },
				      "tags": [
				        "web-features:viewport-unit-variants",
				      ],
				    },
				  },
				  "vh": {
				    "__compat": {
				      "description": "<code>vh</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "20",
				        },
				        "chrome_android": {
				          "version_added": "25",
				        },
				        "edge": {
				          "version_added": "12",
				        },
				        "firefox": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "firefox_android": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "ie": {
				          "version_added": "9",
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "20",
				        },
				        "opera_android": {
				          "version_added": "14",
				        },
				        "safari": {
				          "version_added": "6",
				        },
				        "safari_ios": {
				          "version_added": "6",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.5",
				        },
				        "webview_android": {
				          "version_added": "4.4",
				        },
				        "webview_ios": {
				          "version_added": "6",
				        },
				      },
				      "tags": [
				        "web-features:viewport-units",
				      ],
				    },
				  },
				  "vi": {
				    "__compat": {
				      "description": "<code>vi</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "108",
				        },
				        "chrome_android": {
				          "version_added": "108",
				        },
				        "edge": {
				          "version_added": "108",
				        },
				        "firefox": {
				          "version_added": "101",
				        },
				        "firefox_android": {
				          "version_added": "101",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "94",
				        },
				        "opera_android": {
				          "version_added": "73",
				        },
				        "safari": {
				          "version_added": "15.4",
				        },
				        "safari_ios": {
				          "version_added": "15.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "21.0",
				        },
				        "webview_android": {
				          "version_added": "108",
				        },
				        "webview_ios": {
				          "version_added": "15.4",
				        },
				      },
				      "tags": [
				        "web-features:viewport-unit-variants",
				      ],
				    },
				  },
				  "viewport_percentage_units_dynamic": {
				    "__compat": {
				      "description": "<code>dvb</code>, <code>dvh</code>, <code>dvi</code>, <code>dvmax</code>, <code>dvmin</code>, <code>dvw</code> units",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "108",
				        },
				        "chrome_android": {
				          "version_added": "108",
				        },
				        "edge": {
				          "version_added": "108",
				        },
				        "firefox": {
				          "version_added": "101",
				        },
				        "firefox_android": {
				          "version_added": "101",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "94",
				        },
				        "opera_android": {
				          "version_added": "73",
				        },
				        "safari": {
				          "version_added": "15.4",
				        },
				        "safari_ios": {
				          "version_added": "15.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "21.0",
				        },
				        "webview_android": {
				          "version_added": "108",
				        },
				        "webview_ios": {
				          "version_added": "15.4",
				        },
				      },
				      "tags": [
				        "web-features:viewport-unit-variants",
				      ],
				    },
				  },
				  "viewport_percentage_units_large": {
				    "__compat": {
				      "description": "<code>lvb</code>, <code>lvh</code>, <code>lvi</code>, <code>lvmax</code>, <code>lvmin</code>, <code>lvw</code> units",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "108",
				        },
				        "chrome_android": {
				          "version_added": "108",
				        },
				        "edge": {
				          "version_added": "108",
				        },
				        "firefox": {
				          "version_added": "101",
				        },
				        "firefox_android": {
				          "version_added": "101",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "94",
				        },
				        "opera_android": {
				          "version_added": "73",
				        },
				        "safari": {
				          "version_added": "15.4",
				        },
				        "safari_ios": {
				          "version_added": "15.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "21.0",
				        },
				        "webview_android": {
				          "version_added": "108",
				        },
				        "webview_ios": {
				          "version_added": "15.4",
				        },
				      },
				      "tags": [
				        "web-features:viewport-unit-variants",
				      ],
				    },
				  },
				  "viewport_percentage_units_small": {
				    "__compat": {
				      "description": "<code>svb</code>, <code>svh</code>, <code>svi</code>, <code>svmax</code>, <code>svmin</code>, <code>svw</code> units",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "108",
				        },
				        "chrome_android": {
				          "version_added": "108",
				        },
				        "edge": {
				          "version_added": "108",
				        },
				        "firefox": {
				          "version_added": "101",
				        },
				        "firefox_android": {
				          "version_added": "101",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": false,
				        },
				        "opera": {
				          "version_added": "94",
				        },
				        "opera_android": {
				          "version_added": "73",
				        },
				        "safari": {
				          "version_added": "15.4",
				        },
				        "safari_ios": {
				          "version_added": "15.4",
				        },
				        "samsunginternet_android": {
				          "version_added": "21.0",
				        },
				        "webview_android": {
				          "version_added": "108",
				        },
				        "webview_ios": {
				          "version_added": "15.4",
				        },
				      },
				      "tags": [
				        "web-features:viewport-unit-variants",
				      ],
				    },
				  },
				  "vmax": {
				    "__compat": {
				      "description": "<code>vmax</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "26",
				        },
				        "chrome_android": {
				          "version_added": "26",
				        },
				        "edge": {
				          "version_added": "16",
				        },
				        "firefox": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "firefox_android": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "ie": {
				          "version_added": false,
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "15",
				        },
				        "opera_android": {
				          "version_added": "14",
				        },
				        "safari": {
				          "version_added": "7",
				        },
				        "safari_ios": {
				          "version_added": "7",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.5",
				        },
				        "webview_android": {
				          "version_added": "1.5",
				        },
				        "webview_ios": {
				          "version_added": "7",
				        },
				      },
				      "tags": [
				        "web-features:viewport-units",
				      ],
				    },
				  },
				  "vmin": {
				    "__compat": {
				      "description": "<code>vmin</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "26",
				        },
				        "chrome_android": {
				          "version_added": "26",
				        },
				        "edge": [
				          {
				            "version_added": "12",
				          },
				          {
				            "alternative_name": "vm",
				            "version_added": "12",
				          },
				        ],
				        "firefox": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "firefox_android": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "ie": [
				          {
				            "version_added": "10",
				          },
				          {
				            "alternative_name": "vm",
				            "version_added": "9",
				          },
				        ],
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "15",
				        },
				        "opera_android": {
				          "version_added": "14",
				        },
				        "safari": {
				          "version_added": "7",
				        },
				        "safari_ios": {
				          "version_added": "7",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.5",
				        },
				        "webview_android": {
				          "version_added": "4.4",
				        },
				        "webview_ios": {
				          "version_added": "7",
				        },
				      },
				      "tags": [
				        "web-features:viewport-units",
				      ],
				    },
				  },
				  "vw": {
				    "__compat": {
				      "description": "<code>vw</code> unit",
				      "source_file": "css/types/length.json",
				      "status": {
				        "deprecated": false,
				        "experimental": false,
				        "standard_track": true,
				      },
				      "support": {
				        "chrome": {
				          "version_added": "20",
				        },
				        "chrome_android": {
				          "version_added": "25",
				        },
				        "edge": {
				          "version_added": "12",
				        },
				        "firefox": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "firefox_android": {
				          "notes": "Starting with version 21, viewport-percentage lengths are invalid in <code>@page</code>.",
				          "version_added": "19",
				        },
				        "ie": {
				          "version_added": "9",
				        },
				        "oculus": {
				          "version_added": "5.0",
				        },
				        "opera": {
				          "version_added": "20",
				        },
				        "opera_android": {
				          "version_added": "14",
				        },
				        "safari": {
				          "version_added": "6",
				        },
				        "safari_ios": {
				          "version_added": "6",
				        },
				        "samsunginternet_android": {
				          "version_added": "1.5",
				        },
				        "webview_android": {
				          "version_added": "4.4",
				        },
				        "webview_ios": {
				          "version_added": "6",
				        },
				      },
				      "tags": [
				        "web-features:viewport-units",
				      ],
				    },
				  },
				}
			`);

			const charset = data.atrules["@charset"];
			expect(charset).toBeDefined();
			expect(charset?.__compat).toBeDefined();

			const alignContent = data.properties["-webkit-align-content"];
			expect(alignContent).toBeDefined();
			expect(alignContent?.__compat).toBeDefined();
		});
	});
}

export { parseData };
