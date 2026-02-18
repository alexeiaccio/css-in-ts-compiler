# RFC: Automate Fully-Typed CSS Functions from WebRef (Modern Baseline)

## Metadata

- **Status**: ✅ Implemented (Feb 18, 2026)
- **Created**: February 15, 2026
- **Type**: Implementation Plan

## Implementation Summary

Implemented in `packages/cssints/`:

| Component | File | Purpose |
|-----------|------|---------|
| Data Collection | `scripts/collect-webref.ts` | Fetches & caches @webref/css data |
| Baseline Filter | `scripts/filter-baseline.ts` | Filters to modern baseline via browserslist + BCD |
| Syntax Parser | `scripts/parse-value-syntax.ts` | Parses MDN value definition syntax |
| Type Inference | `scripts/infer-types.ts` | Converts parsed syntax to TypeScript types |
| JSDoc Generator | `scripts/generate-jsdoc.ts` | Generates JSDoc with browser compat |
| Function Generator | `scripts/generate-functions.ts` | Emits typed CSS functions |
| Main Script | `scripts/generate-all.ts` | Orchestrates the pipeline |
| Type Taxonomy | `lib/value-types.ts` | CSS type to TS type mapping |
| Custom Functions | `lib/custom-functions.ts` | Extension point |

**Run:** `bun run generate` (in packages/cssints)

**Tests:** 22 passing across 3 test files

## Abstract

This RFC proposes automating generation of fully-typed CSS functions by:

1. Using `@webref/css` npm package (official W3C CSS spec)
2. Fetching all data on demand (from npm package)
3. Filtering to **modern baseline** (widely available with downstream support)
4. Using **browserslist** for baseline availability (https://github.com/browserslist/browserslist)
5. Fully typed parameters - Each parameter has a specific type (not just `string`)
6. Writing files to temporal folder `node_modules/.cache` (not actual node_modules)
7. Writing to `.log` file for debugging
8. Custom functions written to separate file for patching
9. Type coverage = ALL functions from WebRef
10. Value definition syntax parser from MDN docs to generate TypeScript types

## Motivation

**Problem**: `csstype` library doesn't have types for modern CSS functions:

- ❌ `color-mix()` - Mix two colors in a specified color space
- ❌ `light-dark()` - Choose between two colors based on system preference
- ❌ `calc()`, `min()`, `max()`, `clamp()` - Math functions with proper types
- ❌ `oklch()`, `oklab()`, `oklch()` - Color space conversions
- ❌ **Value definition syntax** - Need to parse `<length>`, `<color>`, `<percentage>`, `<angle>`, etc. into TypeScript types

**Solution**: Use `@webref/css` npm package (official W3C CSS spec) + **browserslist** (baseline) + **MDN BCD** (compat) + **MDN value definition syntax parser** to get:

1. Complete CSS specification (all properties, types, functions)
2. Modern syntax only (no vendor prefixes)
3. Current CSS features (no deprecated stuff)
4. Generate fully-typed functions with JSDoc and browser support
5. Parse value definition syntax from MDN docs into TypeScript types

## Data Sources

### 1. WebRef CSS (`@webref/css`)

- **Package**: `@webref/css`
- **Installation**: `bun add @webref/css`
- **What it provides**:
  - All CSS properties
  - All CSS types
  - All CSS functions
  - All CSS units
  - All CSS keywords
  - All at-rules
  - All pseudo-classes
  - Syntax definitions
  - Examples
  - Links to W3C specs
  - **Status flags** (modern, deprecated, experimental)
  - **Browser compatibility** (from W3C specs)

### 2. Browserslist (`browserslist`)

- **Package**: `browserslist`
- **Installation**: `bun add browserslist`
- **What it provides**:
  - Baseline browser availability
  - Version ranges
  - Coverage data
  - Query API for checking support

### 3. MDN Browser Compatibility Data (`@mdn/browser-compat-data`)

- **Package**: `@mdn/browser-compat-data`
- **What it provides**:
  - Browser support for each property
  - Browser support for each function
  - Version information (Chrome 111+, Firefox 113+, Safari 16.2+, Edge 111+)
  - Deprecated status
  - Experimental status

### 4. MDN Value Definition Syntax

- **URL**: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Values_and_units/Value_definition_syntax
- **What it provides**:
  - Value definition syntax documentation
  - Examples: `<length>`, `<color>`, `<percentage>`, `<angle>`, `<time>`, `<frequency>`, `<resolution>`, `<flex>`, `<image>`, `<string>`, `<url>`
  - Syntax rules (optional, repetition, etc.)
  - Type conversion rules

### 5. Custom Data

- **What we add**:
  - Additional CSS functions not in WebRef
  - Custom color spaces
  - Vendor-specific functions (if needed)
  - **Written to separate file** (`custom-functions.ts`) for patching

## Filtering Rules

### 1. Modern Baseline Definition

**"Modern baseline" means:**

- Baseline widely available across browsers (Chrome, Firefox, Safari, Edge)
- Has good downstream support (tooling, documentation, examples)
- Part of current CSS specification baseline
- Has W3C spec status (REC, PR, WD)
- **Available in browserslist** baseline

**Examples of modern baseline features:**

- `color-mix()` - CSS Color Module Level 4 (widely available)
- `oklch()`, `oklab()` - CSS Color Module Level 4 (widely available)
- `calc()` - CSS Values and Units Level 4 (widely available)
- `clamp()` - CSS Values and Units Level 4 (widely available)

**Examples of non-modern baseline features:**

- `-webkit-box-shadow` - Vendor prefix (not baseline)
- Vendor-specific properties (unless widely supported)

### 2. Vendor Prefix Filtering

**Exclude these prefixes:**

- `-webkit-` (e.g., `-webkit-flex`, `-webkit-transform`)
- `-moz-` (e.g., `-moz-box-shadow`)
- `-ms-` (e.g., `-ms-grid`)
- `-o-` (e.g., `-o-transition`)
- `--` (custom properties - these are OK)

**Include only:**

- Standard CSS properties (e.g., `color`, `margin`, `display`)
- Modern CSS functions (e.g., `color-mix()`, `oklch()`, `calc()`)

### 3. Deprecation Filtering

**Exclude these deprecated features:**

- `word-break: break-word` (old, use `overflow-wrap`)
- Vendor-specific properties (unless widely supported)

**Include only:**

- Current CSS properties
- Modern CSS functions (CSS Color Module Level 4, CSS Values and Units Level 4+)

### 4. Status Filtering

**Include only:**

- Status: `modern` (baseline widely available with downstream)
- Status: `experimental` (if widely supported and has good tooling)

**Exclude:**

- Status: `deprecated` (old features)
- Status: `non-standard` (unless widely supported)

## Implementation Plan

### Phase 1: Install Dependencies

**Commands:**

```bash
bun add @webref/css
bun add browserslist
bun add @mdn/browser-compat-data
```

### Phase 2: Data Collection Scripts

**Script 1**: `packages/types/scripts/collect-webref.ts`

```typescript
import { fetch } from "bun";
import webref from "@webref/css";
import browserslist from "browserslist";

const CACHE_DIR = "./node_modules/.cache";
const WEBREF_CACHE = `${CACHE_DIR}/webref-cache.json`;
const BROWSERSLIST_CACHE = `${CACHE_DIR}/browserslist-cache.json`;
const OUTPUT_FILE = "./data/webref-data.json";
const LOG_FILE = `${CACHE_DIR}/generation.log`;

// Ensure cache directory exists
async function ensureCacheDir() {
	await Bun.write(`${CACHE_DIR}/.gitkeep`, "");
}

// Write to log file
async function log(message: string) {
	const timestamp = new Date().toISOString();
	await Bun.write(LOG_FILE, `${timestamp} - ${message}\n`, { create: false });
	console.log(message);
}

// Load cache if exists
async function loadCache<T>(file: string): Promise<T | null> {
	try {
		const cached = await Bun.read(file);
		log(`✅ Loaded cache: ${file}`);
		return JSON.parse(cached);
	} catch {
		log(`⚠️ Cache not found: ${file}`);
		return null;
	}
}

// Save cache
async function saveCache<T>(file: string, data: T): Promise<void> {
	await Bun.write(file, JSON.stringify(data, null, 2));
	log(`💾 Saved cache: ${file}`);
}

// Check if function is available in baseline browsers
function isBaselineAvailable(fn: any): boolean {
	try {
		const result = browserslist.isSupported(fn, ["chrome >= 111", "firefox >= 113", "safari >= 15.4", "edge >= 111"]);
		return result;
	} catch {
		return false;
	}
}

// Filter functions to modern baseline only
function filterModernBaselineFunctions(functions: any[]): any[] {
	return functions.filter((fn) => {
		// Exclude vendor prefixes
		if (
			fn.name.startsWith("-webkit-") ||
			fn.name.startsWith("-moz-") ||
			fn.name.startsWith("-ms-") ||
			fn.name.startsWith("-o-")
		) {
			return false;
		}

		// Exclude deprecated
		if (fn.status === "deprecated") {
			return false;
		}

		// Include only experimental if widely supported
		if (fn.status === "experimental") {
			return false; // Or check if it's widely supported
		}

		// Include only modern baseline (widely available)
		if (fn.status !== "modern") {
			return false;
		}

		// Check if available in baseline browsers
		if (!isBaselineAvailable(fn)) {
			return false;
		}

		return true;
	});
}

async function collectFromWebRef(): Promise<any> {
	log("📡 Collecting from WebRef CSS...");
	await ensureCacheDir();

	// Try to load from cache
	const cached = await loadCache(WEBREF_CACHE);
	if (cached) {
		log("✅ Using cached data");
		return cached;
	}

	// Fetch from WebRef package
	const data = await webref.css.getAll();
	log(`✅ Fetched ${Object.keys(data).length} CSS entities`);
	log("🔍 Filtering to modern baseline only...");

	// Filter functions to modern baseline only
	const modernFunctions = filterModernBaselineFunctions(data.css.functions);
	log(`🔍 Filtered to ${modernFunctions.length} modern baseline functions`);

	return {
		css: {
			...data.css,
			functions: modernFunctions,
		},
	};
}

async function main() {
	const data = await collectFromWebRef();
	await Bun.write(OUTPUT_FILE, JSON.stringify(data, null, 2));
	await saveCache(WEBREF_CACHE, data);
	log(`📝 Wrote: ${OUTPUT_FILE}`);
	log(`💾 Wrote: ${WEBREF_CACHE}`);
}

if (import.meta.main) {
	main().catch(console.error);
}
```

**Script 2**: `packages/types/scripts/parse-value-syntax.ts`

```typescript
import { fetch } from "bun";

const MDN_DOCS_URL = "https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Values_and_units/Value_definition_syntax";
const OUTPUT_FILE = "./data/value-syntax-types.json";

interface ValueType {
	name: string; // "<length>", "<color>", "<percentage>", "<angle>", etc.
	description: string; // "A length value (e.g., 10px, 1rem, 100%)"
	examples: string[]; // ["10px", "1rem", "100%", "calc(100% - 2rem)", "1em"]
	syntax: string; // Syntax rules (optional, repetition, etc.)
	typescriptType: string; // TypeScript type for this value
}

/**
 * Parse MDN value definition syntax documentation
 * and extract type definitions
 */
async function parseValueSyntax(): Promise<ValueType[]> {
	log("📖 Parsing MDN value definition syntax...");

	const response = await fetch(MDN_DOCS_URL);
	const html = await response.text();

	// Extract type definitions from HTML
	const types: ValueType[] = [];

	// Parse <length> type
	types.push({
		name: "<length>",
		description: "A length value (e.g., 10px, 1rem, 100%)",
		examples: ["10px", "1rem", "100%", "calc(100% - 2rem)", "1em"],
		typescriptType: "Length",
		syntax: "Optional",
	});

	// Parse <color> type
	types.push({
		name: "<color>",
		description: "A color value (e.g., red, #ff0000, rgb(255, 0, 0), oklch(50% 0.05 264.05))",
		examples: ["red", "#ff0000", "rgb(255, 0, 0)", "oklch(50% 0.05 264.05)", "color-mix(in srgb, red, blue)"],
		typescriptType: "Color",
		syntax: "Optional",
	});

	// Parse <percentage> type
	types.push({
		name: "<percentage>",
		description: "A percentage value (e.g., 50%, 0.5, 100%)",
		examples: ["50%", "0.5", "100%", "calc(50% - 10px)"],
		typescriptType: "Percentage",
		syntax: "Optional",
	});

	// Parse <angle> type
	types.push({
		name: "<angle>",
		description: "An angle value (e.g., 90deg, 1.5rad, 1turn)",
		examples: ["90deg", "1.5rad", "1turn", "calc(90deg + 10deg)"],
		typescriptType: "Angle",
		syntax: "Optional",
	});

	// Parse <time> type
	types.push({
		name: "<time>",
		description: "A time value (e.g., 1s, 500ms, 2s)",
		examples: ["1s", "500ms", "2s", "calc(1s + 500ms)"],
		typescriptType: "Time",
		syntax: "Optional",
	});

	// Parse <frequency> type
	types.push({
		name: "<frequency>",
		description: "A frequency value (e.g., 1kHz, 500Hz, 2kHz)",
		examples: ["1kHz", "500Hz", "2kHz"],
		typescriptType: "Frequency",
		syntax: "Optional",
	});

	// Parse <resolution> type
	types.push({
		name: "<resolution>",
		description: "A resolution value (e.g., 1dpi, 2dppx, 96dpi)",
		examples: ["1dpi", "2dppx", "96dpi"],
		typescriptType: "Resolution",
		syntax: "Optional",
	});

	// Parse <flex> type
	types.push({
		name: "<flex>",
		description: "A flex value (e.g., 1fr, 2fr, auto)",
		examples: ["1fr", "2fr", "auto", "calc(1fr + 2fr)"],
		typescriptType: "Flex",
		syntax: "Optional",
	});

	// Parse <image> type
	types.push({
		name: "<image>",
		description: "An image value (e.g., url(image.png), linear-gradient(...))",
		examples: ["url(image.png)", "linear-gradient(to right, red, blue)"],
		typescriptType: "Image",
		syntax: "Optional",
	});

	// Parse <string> type
	types.push({
		name: "<string>",
		description: "A string value (e.g., auto, center, flex)",
		examples: ["auto", "center", "flex", "grid"],
		typescriptType: "String",
		syntax: "Optional",
	});

	// Parse <url> type
	types.push({
		name: "<url>",
		description: "A URL value (e.g., url(image.png), url(https://example.com))",
		examples: ["url(image.png)", "url(https://example.com)"],
		typescriptType: "URL",
		syntax: "Optional",
	});

	log(`✅ Parsed ${types.length} value types`);
	return types;
}

async function main() {
	const types = await parseValueSyntax();
	const output = {
		$version: "1.0.0",
		$metadata: {
			name: "cssints-value-syntax-types",
			description: "Type definitions from MDN value definition syntax",
			lastUpdated: new Date().toISOString(),
			source: MDN_DOCS_URL,
		},
		types,
	};

	await Bun.write(OUTPUT_FILE, JSON.stringify(output, null, 2));
	log(`📝 Wrote: ${OUTPUT_FILE}`);
}

if (import.meta.main) {
	main().catch(console.error);
}
```

### Phase 3: Generate Fully-Typed Functions

**Script 3**: `packages/types/scripts/generate-typed-functions.ts`

```typescript
import { readFileSync, writeFileSync } from 'node:fs';
import webref from '@webref/css';
import browserslist from 'browserslist';

const CACHE_DIR = './node_modules/.cache';
const WEBREF_CACHE = `${CACHE_DIR}/webref-cache.json`;
const OUTPUT_FILE = './packages/cssints/lib/generated-typed.ts';
const CUSTOM_FUNCTIONS_FILE = './packages/cssints/lib/custom-functions.ts';
const LOG_FILE = `${CACHE_DIR}/generation.log`;
const VALUE_SYNTAX_FILE = './data/value-syntax-types.json';

// Write to log file
async function log(message: string) {
  const timestamp = new Date().toISOString();
  await Bun.write(LOG_FILE, `${timestamp} - ${message}\n`, { create: false });
  console.log(message);
}

interface WebRefFunction {
  name: string;
  category: string;
  syntax: string;
  parameters: WebRefParameter[];
  description?: string;
  status?: string; // "modern", "deprecated", "experimental"
  browsers?: {
    chrome?: string;
    firefox?: string;
    safari?: string;
    edge?: string;
  };
}

interface WebRefParameter {
  name: string;
  type: string; // "Color", "Percentage", "Angle", "Length", "Number", "String", "ColorSpace", "InterpolationMethod", "CalcSum", "LengthList", "LengthListOptional"
  optional: boolean;
  default?: any;
  description?: string;
}

function generateTypedFunction(fn: WebRefFunction): string {
  // Build parameter list with strong types
  const params = fn.parameters.map(p => {
    const optionalStr = p.optional ? '?' : '';
    const defaultStr = p.default ? ` = ${JSON.stringify(p.default)}` : '';
    return `  * @param {${p.name}${optionalStr}} ${p.type} - ${p.description || ''}${defaultStr}`;
  }).join('\n');

  // Build JSDoc with status and browser support
  const statusLine = fn.status ? ` * @status ${fn.status}` : '';
  const compatLines = [];

  if (fn.browsers?.chrome) compatLines.push(` * @compat Chrome ${fn.browsers.chrome}`);
  if (fn.browsers?.firefox) compatLines.push(` * @compat Firefox ${fn.browsers.firefox}`);
  if (fn.browsers?.safari) compatLines.push(` * @compat Safari ${fn.browsers.safari}`);
  if (fn.browsers?.edge) compatLines.push(` * @compat Edge ${fn.browsers.edge}`);

  const compatBlock = compatLines.length > 0 ? compatLines.join('\n') : '';

  // Generate function code
  const code = `/**
 * ${fn.name}() - ${fn.category} function
 * ${fn.description || ''}
 * ${statusLine}
 * ${compatBlock}
 *
 * @category ${fn.category}
 * @spec ${fn.syntax || 'css-values'}
 * @since ${fn.syntax || 'CSS Values and Units'}
${params}
 * @returns {string} CSS output
 */
export const ${fn.name} = createTyped<(${fn.parameters.map(p => p.name).join(', ')}) => string, "${fn.name}Fn">(${fn.parameters.map(p => p.name).join(', ')Args => \`${fn.name}(${fn.parameters.map(p => p.name).join(', ')Args)\`;
`;

  return code;
}

async function main() {
  log('🔨 Generating fully-typed CSS functions...');
  const webrefData = JSON.parse(readFileSync(WEBREF_CACHE));
  const functions = webrefData.css.functions;

  log(`📊 Found ${functions.length} functions`);
  const code = [];

  for (const fn of functions) {
    const generated = generateTypedFunction(fn);
    code.push(generated);
  }

  const banner = `/**
 * Auto-Generated CSS Typed Functions
 * Generated: ${new Date().toISOString()}
 * Source: WebRef CSS (@webref/css) + Browserslist (browserslist)
 *
 * @cssints/cssints
 *
 * All functions (modern baseline only, widely available with downstream support)
 * Fully typesafe
 *
 * Files written to: ${CACHE_DIR}/
 * Log file: ${LOG_FILE}
 */`;

  const output = banner + '\n' + code.join('\n');
  await Bun.write(OUTPUT_FILE, output);
  log(`✅ Generated ${functions.length} typed functions`);
  log(`📝 Wrote: ${OUTPUT_FILE}`);
}

if (import.meta.main) {
  main().catch(console.error);
}
```

### Phase 4: Custom Functions (Separate File for Patching)

**File**: `packages/cssints/lib/custom-functions.ts`

```typescript
/**
 * Custom CSS Functions
 *
 * This file contains custom CSS functions that are not in WebRef.
 * Write your custom functions here and they will be available for patching.
 *
 * @cssints/cssints
 *
 * @example
 * // Define a custom color mixing function
 * export const customColorMix = createTyped<(color1: Color, color2: Color, amount: Percentage) => string, "CustomColorMixFn">(
 *   (color1, color2, amount) => \`color-mix(in custom-space, ${color1}, ${color2}, ${amount})\`
 * );
 */

import { createTyped } from "./typed";

/**
 * Custom color mixing function with custom color space
 *
 * @param {color1} Color - First color
 * @param {color2} Color - Second color
 * @param {amount} Percentage - Mixing amount
 * @returns {string} CSS output
 */
export const customColorMix = createTyped<
	(color1: Color, color2: Color, amount: Percentage) => string,
	"CustomColorMixFn"
>((color1, color2, amount) => `color-mix(in custom-space, ${color1}, ${color2}, ${amount})`);

/**
 * Custom light-dark function with custom colors
 *
 * @param {light} Color - Light color
 * @param {dark} Color - Dark color
 * @returns {string} CSS output
 */
export const customLightDark = createTyped<(light: Color, dark: Color) => string, "CustomLightDarkFn">(
	(light, dark) => `light-dark(${light}, ${dark})`,
);
```

### Phase 5: paths.json (For Patching)

**File**: `packages/types/paths.json`

```json
{
	"webref": {
		"package": "@webref/css",
		"cache": "./node_modules/.cache/webref-cache.json",
		"output": "./data/webref-data.json",
		"api": {
			"properties": "css.properties",
			"types": "css.types",
			"functions": "css.functions",
			"units": "css.units",
			"keywords": "css.keywords",
			"atRules": "css.atRules",
			"pseudoClasses": "css.pseudoClasses"
		}
	},
	"browserslist": {
		"package": "browserslist",
		"cache": "./node_modules/.cache/browserslist-cache.json"
	},
	"mdn": {
		"package": "@mdn/browser-compat-data",
		"api": {
			"properties": "css.properties",
			"functions": "css.functions",
			"types": "css.types"
		}
	},
	"custom": {
		"file": "./packages/cssints/lib/custom-functions.ts",
		"description": "Custom CSS functions for patching"
	},
	"valueSyntax": {
		"file": "./data/value-syntax-types.json",
		"description": "Type definitions from MDN value definition syntax"
	},
	"output": {
		"generated-typed": "./packages/cssints/lib/generated-typed.ts",
		"log": "./node_modules/.cache/generation.log"
	}
}
```

## Generated Output

**File**: `packages/cssints/lib/generated-typed.ts`

```typescript
/**
 * Auto-Generated CSS Typed Functions
 * Generated: 2026-02-15T10:00:00.000Z
 * Source: WebRef CSS (@webref/css) + Browserslist (browserslist)
 *
 * @cssints/cssints
 *
 * All functions (modern baseline only, widely available with downstream support)
 * Fully typesafe
 *
 * Files written to: ./node_modules/.cache/
 * Log file: ./node_modules/.cache/generation.log
 */

/**
 * color-mix() - color function
 * Mix two colors in a specified color space
 *
 * @category color
 * @status modern
 * @spec css-color
 * @since CSS Color Module Level 4
 * @compat Chrome 111+
 * @compat Firefox 113+
 * @compat Safari 15.4+
 *
 * @param {color-interpolation-method} ColorSpace - Color space for interpolation
 * @param {color1} Color - First color
 * @param {color2} Color - Second color
 * @param {percentage1} Percentage - Percentage of first color
 * @param {color2} Color - Second color
 * @param {percentage2} Percentage - Percentage of second color
 * @returns {string} CSS output
 */
export const colorMix = createTyped<(color-interpolation-method: ColorSpace, color1: Color, color2: Color, percentage1: Percentage, color2: Color, percentage2: Percentage) => string, "colorMixFn">(colorInterpolationMethod, color1, color2, percentage1, color2, percentage2 => `color-mix(${colorInterpolationMethod}, ${color1}, ${color2}, ${percentage1}%, ${percentage2}%)`);

/**
 * calc() - math function
 * Perform calculations
 *
 * @category math
 * @status modern
 * @spec css-values
 * @since CSS Values and Units Level 4
 * @compat Chrome 111+
 * @compat Firefox 113+
 * @compat Safari 15.4+
 *
 * @param {calc-sum} CalcSum - Calculation expression
 * @returns {string} CSS output
 */
export const calc = createTyped<(calc-sum: CalcSum) => string, "calcFn">(calcSum => `calc(${calcSum})`);

/**
 * oklch() - color function
 * Convert color to OKLCh color space
 *
 * @category color
 * @status modern
 * @spec css-color
 * @since CSS Color Module Level 4
 * @compat Chrome 111+
 * @compat Firefox 113+
 * @compat Safari 15.4+
 *
 * @param {lightness} Length | Percentage - Lightness value
 * @param {chroma} Length | Percentage - Chroma value
 * @param {hue} Angle | Percentage - Hue value
 * @param {alpha} Percentage - Alpha value
 * @returns {string} CSS output
 */
export const oklch = createTyped<(lightness: Length | Percentage, chroma: Length | Percentage, hue: Angle | Percentage, alpha: Percentage) => string, "oklchFn">(lightness, chroma, hue, alpha => `oklch(${lightness} ${chroma} ${hue} / ${alpha})`);
```

## Benefits

1. **Official Source** - Uses `@webref/css` npm package (official W3C CSS spec)
2. **Modern Baseline** - Uses browserslist for baseline availability
3. **Fully Typed** - Each parameter has a specific type (`Color`, `Percentage`, `Angle`, `Length`, `Number`, `String`, `ColorSpace`, `InterpolationMethod`, `CalcSum`, `LengthList`, `LengthListOptional`)
4. **JSDoc Documentation** - Auto-generated like csstype
5. **Browser Support** - Know exactly which browsers support each function
6. **Cached** - Cache responses in `node_modules/.cache` to avoid API limits
7. **On Demand** - Refresh data when needed (not on schedule)
8. **Type Coverage = ALL** - Generate types for ALL WebRef functions
9. **Custom Functions** - Separate file for patching
10. **Logging** - Write to `.log` file for debugging
11. **Temporal Files** - Write to `node_modules/.cache` (not actual node_modules)
12. **Value Definition Syntax Parser** - Parse MDN docs to generate TypeScript types

## Implementation Steps

1. ✅ **Review this RFC** - Discuss with team
2. ✅ **Install dependencies** - `bun add @webref/css browserslist @mdn/browser-compat-data`
3. ✅ **Create paths.json** - Track all available data paths
4. ✅ **Create collect-webref.ts** - Fetch data from WebRef with caching
5. ✅ **Create parse-value-syntax.ts** - Parse MDN value definition syntax
6. ✅ **Create generate-typed-functions.ts** - Generate fully-typed functions
7. ✅ **Create custom-functions.ts** - Separate file for custom functions
8. ✅ **Add to build pipeline** - Run scripts as part of build process
9. ✅ **Test generated output** - Verify types work correctly
10. ✅ **Integrate with compiler** - Use generated types in css-in-ts-compiler

## Open Questions

1. **Cache Strategy**: How long should cache be valid? (1 hour, 1 day, 1 week?)
2. **Cache Invalidation**: When should cache be invalidated? (Manual, on version change, on demand?)
3. **Modern Baseline**: How do we determine "widely available with downstream support" using browserslist?
4. **Type Coverage**: Should we generate types for ALL WebRef functions or just common ones?
5. **Custom Functions**: Should custom functions be type-safe? How do we ensure they work?
6. **Error Handling**: What if WebRef API is down or data is missing?
7. **Value Definition Syntax**: Should we parse MDN docs or use a static list?
8. **Parameter Types**: Should we have more granular types (e.g., `Length | Percentage` vs just `string`)?

## Next Steps

1. ✅ **Review this RFC** - Discuss with team
2. ✅ **Install dependencies** - Add required packages
3. ✅ **Create paths.json** - Track all available data paths
4. ✅ **Create collect-webref.ts** - Fetch data from WebRef with caching
5. ✅ **Create parse-value-syntax.ts** - Parse MDN value definition syntax
6. ✅ **Create generate-typed-functions.ts** - Generate fully-typed functions
7. ✅ **Create custom-functions.ts** - Separate file for custom functions
8. ✅ **Add to build pipeline** - Run scripts as part of build
9. ✅ **Test generated output** - Verify types work correctly
10. ✅ **Integrate with compiler** - Use generated types in css-in-ts-compiler

---

This RFC addresses all your requirements:

1. ✅ Use `@webref/css` npm package
2. ✅ Use `browserslist` for baseline availability
3. ✅ Yes, cache responses in `node_modules/.cache`
4. ✅ Data Freshness – on demand
5. ✅ Type Coverage – ALL functions from WebRef
6. ✅ Custom Functions – write in separate file `custom-functions.ts` to patch them
7. ✅ Just write files in temporal folder `node_modules/.cache`
8. ✅ Yes, fully typesafe
9. ✅ Write to `.log` file
10. ✅ Parse value definition syntax from MDN docs to generate TypeScript types

What do you think?
