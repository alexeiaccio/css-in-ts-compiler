# LightningCSS Integration Plan (Option C: Hybrid)

## Overview

Integrate LightningCSS postprocessing into the compiler pipeline while using LightningCSS AST types as reference to enhance BCD schema generation completeness.

---

## Current System

### Data Sources

- `@mdn/browser-compat-data` - Browser compatibility data
- `@webref/css` - CSS specification data

### Type Generation

- Custom BCD schema generator → Effect Schema
- ~585 property functions generated
- ~234 lines of type schemas

### Type Coverage

- Length: ~18 units
- Angle: deg, grad, rad, turn
- Time: s, ms
- Resolution: dpi, dpcm, dppx, x
- Color: `Schema.String` (minimal)
- Math functions: None
- Gradients: None

---

## LightningCSS Reference

### Size & Coverage

- ~10,000 lines of TypeScript definitions
- 273 type definitions
- ~400+ CSS properties (typed `PropertyId` union)

### Key Types Available

#### Value Types

**Length** (40+ units):

- Physical: cm, mm, Q, in, pc, pt, px
- Font: em, rem, ex, ch, cap, ic, lh, rlh, rcap, rch, rex, ric
- Viewport: vw, vh, vmin, vmax, vb, vi
- Viewport variants:
  - Dynamic: dvb, dvh, dvi, dvmax, dvmin, dvw
  - Large: lvb, lvh, lvi, lvmax, lvmin, lvw
  - Small: svb, svh, svi, svmax, svmin, svw
- Container: cqw, cqh, cqi, cqb, cqmin, cqmax

**Color**: RGB, HSL, LAB, HSL, OKLCH, OKLAB, LightDark, SystemColor, PredefinedColor, UnresolvedColor

**Math Functions**: calc, min, max, clamp, round, rem, mod, abs, sign, hypot

**Gradients**: Linear, Radial, Conic, WebKit variants

**Transform Functions**: rotate, scale, translate, skew, matrix variants

#### Rule Types

- MediaRule, StyleRule, KeyframesRule, FontFaceRule
- ContainerRule, ScopeRule, StartingStyleRule
- SupportsRule, ImportRule, LayerRule, etc.

#### Media Query Types

- MediaCondition, QueryFeature, MediaFeatureValue
- 30+ media features: width, height, aspect-ratio, orientation, resolution, prefers-color-scheme, prefers-reduced-motion, etc.

---

## Architecture: Integration Points

### Current Flow

```
TS Source → OXC Parser → Style Extraction → CSS Registry → Raw CSS Generation
```

### Proposed Flow

```
TS Source → OXC Parser → Style Extraction → CSS Registry
  → Raw CSS Generation → LightningCSS Postprocessing → Final CSS
```

### Integration Points

1. **`packages/compiler/src/compiler.ts:generateCSS()`**
   - Pipe output through LightningCSS
   - Add compiler options for LightningCSS

2. **`packages/compiler/src/oxc-plugin.ts:generateCssFromStyles()`**
   - Integrate LightningCSS in dev/build modes
   - Disable in development for faster builds

3. **`packages/compiler/src/cli.ts:build()`**
   - Postprocess final CSS before output
   - Add CLI options for LightningCSS features

---

## Phase 1: Gap Analysis Tool

### 1.1 Create Type Comparison Script

**File**: `packages/cssints/scripts/compare-lightningcss.ts`

```typescript
/**
 * Compare BCD-generated types with LightningCSS AST
 *
 * Outputs:
 * - Missing length units
 * - Missing color types
 * - Missing math functions
 * - Missing properties
 */
```

**Tasks**:

1. Parse LightningCSS AST file (downloaded reference)
2. Extract all `LengthUnit`, `AngleUnit`, `TimeUnit` values
3. Extract all color type variants (RGB, HSL, LAB, OKLCH, etc.)
4. Extract all `PropertyId` union members (~400+ properties)
5. Compare with `types.bcd.gen.ts` exports
6. Compare with `properties.gen.ts` generated functions
7. Generate markdown report with:
   - Coverage percentages
   - Missing items by category
   - Recommendations for priority

### 1.2 Schema Completeness Validation

**File**: `packages/cssints/scripts/validate-schema-completeness.ts`

**Tasks**:

1. Load BCD types from `mdn-data/css/syntaxes.json`
2. Parse all nested type definitions (currently only top-level extracted)
3. For each type, check if corresponding schema exists
4. Identify:
   - Units not in Length/Angle/Time/Resolution unions
   - Functions not in schema (calc, min, max, clamp, color-mix)
   - Keywords missing from property syntaxes
5. Generate TODO list for generator improvements

---

## Phase 2: Type System Enhancements

### 2.1 Enhanced Length Units

**File**: `packages/cssints/scripts/generate-bcd-schemas.ts`

**Add Missing Units**:

```typescript
// Currently have: px, rem, Q
// LightningCSS has (40+):
- Physical: cm, mm, Q, in, pc, pt
- Font: em, rem, ex, ch, cap, ic, lh, rlh, rcap, rch, rex, ric
- Viewport: vw, vh, vmin, vmax, vb, vi
- Viewport variants:
  - Dynamic: dvb, dvh, dvi, dvmax, dvmin, dvw
  - Large: lvb, lvh, lvi, lvmax, lvmin, lvw
  - Small: svb, svh, svi, svmax, svmin, svw
- Container: cqw, cqh, cqi, cqb, cqmin, cqmax
```

### 2.2 Enhanced Color Types

**File**: `packages/cssints/scripts/generate-bcd-schemas.ts`

**Current**: `export const Color = Schema.String;`

**Proposed**:

```typescript
/**
 * Color value - complex type with multiple representations
 *
 * Based on LightningCSS CssColor union
 */
export const Color = Schema.Union([
	// Named colors and hex
	HexColor,
	NamedColor,
	CurrentColor,

	// Functional notations
	RGBColor,
	RGBAColor,
	HSLColor,
	HSLAColor,
	HWBColor,

	// Modern color spaces
	LABColor,
	LCHColor,
	OKLABColor,
	OKLCHColor,

	// Light/dark mode
	LightDark,

	// System colors
	SystemColor,

	// Variables
	CSSVariable,

	// Unresolved (for future validation)
	UnresolvedColor,
]);

// Helper schemas
export const RGBColor = Schema.TemplateLiteral(
	`rgb(${Schema.FiniteFromString}, ${Schema.FiniteFromString}, ${Schema.FiniteFromString})`,
);

export const OKLCHColor = Schema.TemplateLiteral(
	`oklch(${Schema.FiniteFromString}% ${Schema.FiniteFromString} ${Schema.FiniteFromString})`,
);
// ... more color schemas
```

### 2.3 Add Math Function Types

**File**: `packages/cssints/scripts/generate-bcd-schemas.ts`

**New Schemas**:

```typescript
/**
 * Math functions - from LightningCSS MathFunctionFor_Length
 */
export const CalcFunction = Schema.TemplateLiteral(`calc(${Schema.String})`);

export const MinFunction = Schema.TemplateLiteral(`min(${Schema.String}, ${Schema.String.repeat()})`);

export const MaxFunction = Schema.TemplateLiteral(`max(${Schema.String}, ${Schema.String.repeat()})`);

export const ClampFunction = Schema.TemplateLiteral(`clamp(${Schema.String}, ${Schema.String}, ${Schema.String})`);

export const RoundFunction = Schema.TemplateLiteral(`round(${Schema.String}, ${Schema.String}, ${Schema.String})`);

export const RemFunction = Schema.TemplateLiteral(`rem(${Schema.String}, ${Schema.String})`);

export const ModFunction = Schema.TemplateLiteral(`mod(${Schema.String}, ${Schema.String})`);

export const AbsFunction = Schema.TemplateLiteral(`abs(${Schema.String})`);

export const SignFunction = Schema.TemplateLiteral(`sign(${Schema.String})`);

export const HypotFunction = Schema.TemplateLiteral(`hypot(${Schema.String.repeat()})`);

// Union of all math functions
export const MathFunction = Schema.Union([
	CalcFunction,
	MinFunction,
	MaxFunction,
	ClampFunction,
	RoundFunction,
	RemFunction,
	ModFunction,
	AbsFunction,
	SignFunction,
	HypotFunction,
]);
```

### 2.4 Add Gradient Types

**File**: `packages/cssints/scripts/generate-bcd-schemas.ts`

**New Schemas**:

```typescript
/**
 * Gradient functions - from LightningCSS Gradient types
 */
export const LinearGradient = Schema.TemplateLiteral(`linear-gradient(${Schema.String}, ${Schema.String.repeat()})`);

export const RadialGradient = Schema.TemplateLiteral(`radial-gradient(${Schema.String}, ${Schema.String.repeat()})`);

export const ConicGradient = Schema.TemplateLiteral(`conic-gradient(${Schema.String}, ${Schema.String.repeat()})`);

// WebKit variants (for older browsers)
export const WebKitLinearGradient = Schema.TemplateLiteral(
	`-webkit-linear-gradient(${Schema.String}, ${Schema.String.repeat()})`,
);

export const Image = Schema.Union([LinearGradient, RadialGradient, ConicGradient, URLImage, Gradient]);
```

---

## Phase 3: LightningCSS Runtime Integration

### 3.1 Install & Configure

**Command**:

```bash
cd packages/compiler
bun add lightningcss
```

**File**: `packages/compiler/src/postprocess/lightningcss.ts`

```typescript
import { transform, type Targets } from "lightningcss";

export interface LightningCSSOptions {
	/** Target browsers for autoprefixing */
	targets?: Targets;
	/** Minify CSS */
	minify?: boolean;
	/** Enable source maps */
	sourceMaps?: boolean;
	/** Enable CSS nesting support */
	nesting?: boolean;
	/** Enable custom properties */
	customProperties?: boolean;
}

const DEFAULT_TARGETS: Targets = {
	// Browser targets for production
	browsers: ["> 0.2%", "not dead"],
};

export function transformWithLightningCSS(css: string, options: LightningCSSOptions = {}): string {
	const {
		targets = DEFAULT_TARGETS,
		minify = true,
		sourceMaps = false,
		nesting = true,
		customProperties = true,
	} = options;

	const result = transform({
		filename: "output.css",
		code: Buffer.from(css),
		minify,
		sourceMap: sourceMaps,
		targets,
		drafts: {
			nesting, // Enable @nest support
			customProperties, // Enable @property support
		},
	});

	return result.code.toString();
}
```

### 3.2 Integrate into Compiler

**File**: `packages/compiler/src/compiler.ts`

**Modify** `generateCSS()` function:

```typescript
import { transformWithLightningCSS, type LightningCSSOptions } from "./postprocess/lightningcss.js";

export interface CompilerOptions {
	lightningcss?: LightningCSSOptions;
}

let compilerOptions: CompilerOptions = {};

export function setCompilerOptions(options: CompilerOptions): void {
	compilerOptions = { ...compilerOptions, ...options };
}

// Generate CSS from all registered classes
export function generateCSS(): string {
	// ... existing code to generate raw CSS ...

	const rawCSS = css.join("\n\n");

	// Postprocess with LightningCSS
	if (compilerOptions.lightningcss !== undefined) {
		return transformWithLightningCSS(rawCSS, compilerOptions.lightningcss);
	}

	return rawCSS;
}
```

### 3.3 Integrate into OXC Plugin

**File**: `packages/compiler/src/oxc-plugin.ts`

**Modify** `generateCssFromStyles()`:

```typescript
import { transformWithLightningCSS, type LightningCSSOptions } from "./postprocess/lightningcss.js";

export interface OxcPluginOptions {
	// ... existing options ...
	lightningcss?: LightningCSSOptions;
}

// ... in generateCssFromStyles ...

function generateCssFromStyles(fileId: string, styles: Map<string, StyleMapping>, devMode: boolean): string {
	// ... existing code to generate raw CSS ...

	const rawCSS = cssParts.join("\n\n");

	// Postprocess with LightningCSS
	if (opts.lightningcss && !isDevMode()) {
		return transformWithLightningCSS(rawCSS, opts.lightningcss);
	}

	return rawCSS;
}
```

### 3.4 Integrate into CLI

**File**: `packages/compiler/src/cli.ts`

```typescript
import { transformWithLightningCSS, type LightningCSSOptions } from "./postprocess/lightningcss.js";

interface CLIOptions {
	output?: string;
	watch: boolean;
	help: boolean;
	// LightningCSS options
	minify?: boolean;
	noAutoprefixer?: boolean;
}

export async function build(inputPath?: string, outputPath?: string, minify: boolean = true): Promise<void> {
	// ... existing code ...

	const rawCSS = generateCSS();

	// Postprocess with LightningCSS
	const finalCSS = transformWithLightningCSS(rawCSS, {
		minify,
		targets: !options.noAutoprefixer
			? {
					browsers: ["> 0.2%", "not dead"],
				}
			: undefined,
	});

	// ... write finalCSS instead of rawCSS ...
}
```

---

## Phase 4: Schema Generator Enhancements

### 4.1 Extract Nested Type Definitions

**File**: `packages/cssints/scripts/generate-bcd-schemas.ts`

**Issue**: Current generator only processes top-level BCD types

**Fix**: Add recursive extraction for nested types

```typescript
const extractAllTypes = (bcdTypes: Record<string, unknown>): Map<string, TypeAnalysis> => {
	const analyses = new Map<string, TypeAnalysis>();

	const processEntry = (typeName: string, entry: any, parentName?: string): void => {
		const compat = entry.__compat;
		const fullTypeName = parentName ? `${parentName}-${typeName}` : typeName;

		// Extract units from description
		const units = extractUnitsFromDescription(compat?.description, typeName);

		// Extract type references
		const references: string[] = [];
		if (compat?.description) {
			const typeRefMatch = compat.description.match(/<([a-z-]+)>/g);
			if (typeRefMatch) {
				for (const ref of typeRefMatch) {
					const refName = ref.replace(/[<>]/g, "");
					if (refName !== typeName) {
						references.push(refName);
					}
				}
			}
		}

		analyses.set(fullTypeName, {
			name: fullTypeName,
			compat,
			units,
			references,
		});

		// Recursively process nested types
		if (entry && typeof entry === "object") {
			for (const [nestedName, nestedEntry] of Object.entries(entry)) {
				if (nestedName === "__compat") continue;
				if (nestedEntry && typeof nestedEntry === "object" && nestedEntry.__compat) {
					processEntry(nestedName, nestedEntry, fullTypeName);
				}
			}
		}
	};

	for (const [typeName, typeData] of Object.entries(bcdTypes)) {
		if (typeName === "__compat") continue;
		processEntry(typeName, typeData);
	}

	return analyses;
};
```

### 4.2 Generate Function Schemas

**File**: `packages/cssints/scripts/generate-function-schemas.ts`

**New script** to generate typed functions from BCD + WebRef function data

```typescript
/**
 * Generate typed function schemas
 *
 * Sources:
 * - BCD function compatibility data
 * - WebRef function syntax definitions
 *
 * Outputs:
 * - Function schemas for: color-mix, clamp, min, max, calc, etc.
 * - Typed signatures matching LightningCSS AST
 */
```

**Generated schemas**:

```typescript
// Generated in packages/cssints/src/generated/functions.gen.ts

/**
 * Mix two colors with interpolation
 *
 * **Syntax**: `color-mix(<color-interpolation-method>, <color> && <percentage>?, <color> && <percentage>?)`
 *
 * @see https://developer.mozilla.org/docs/Web/CSS/color-mix
 */
export const ColorMixFunction = Schema.TemplateLiteral(
	`color-mix(${Schema.String}, ${Schema.String}, ${Schema.optional(Schema.String)})`,
);

// Helper function
export function colorMix(
	interpolationMethod: string,
	color1: string | Color,
	color2: string | Color,
	percentage1?: number,
	percentage2?: number,
): string {
	// Implementation
}
```

### 4.3 Generate Media Query Types

**File**: `packages/cssints/scripts/generate-media-types.ts`

**New script** to generate typed media query helpers

```typescript
/**
 * Generate typed media query functions
 *
 * Based on LightningCSS MediaCondition, QueryFeature, MediaFeatureValue
 *
 * Outputs:
 * - Type-safe media query builders
 * - Media feature validation
 */
```

**Generated types**:

```typescript
// packages/cssints/src/generated/media.gen.ts

/**
 * Media feature - typed based on LightningCSS MediaFeatureId
 */
export type MediaFeature =
  | "width"
  | "height"
  | "aspect-ratio"
  | "orientation"
  | "resolution"
  | "prefers-color-scheme"
  | "prefers-reduced-motion"
  | // ... 30+ features from LightningCSS

/**
 * Media query builder
 */
export function media(feature: MediaFeature, value: string | number): CSSProperties {
  return { [`@media (${feature}: ${value})`]: {} };
}

// Typed variants
export const minWidth = (value: string | number): CSSProperties =>
  media("min-width", value);

export const prefersColorScheme = (scheme: "light" | "dark" | "no-preference"): CSSProperties =>
  media("prefers-color-scheme", scheme);

export const prefersReducedMotion = (value: "reduce" | "no-preference"): CSSProperties =>
  media("prefers-reduced-motion", value);
```

---

## Phase 5: Testing & Validation

### 5.1 Type Coverage Tests

**File**: `packages/cssints/src/__tests__/type-coverage.test.ts`

```typescript
describe("Type Coverage", () => {
	it("has all LightningCSS length units", () => {
		// Verify all 40+ length units are present
	});

	it("has all LightningCSS color types", () => {
		// Verify RGB, HSL, LAB, OKLCH, etc.
	});

	it("has all math functions", () => {
		// Verify calc, min, max, clamp, round, etc.
	});

	it("matches LightningCSS PropertyId coverage", () => {
		// Compare generated properties with LightningCSS PropertyId union
	});
});
```

### 5.2 CSS Output Tests

**File**: `packages/compiler/src/__tests__/lightningcss.test.ts`

```typescript
import { transformWithLightningCSS } from "../postprocess/lightningcss.js";

describe("LightningCSS Integration", () => {
	it("autoprefixes CSS properties", () => {
		const input = `
.user-select-none {
  user-select: none;
}`;
		const output = transformWithLightningCSS(input);
		expect(output).toContain("-webkit-user-select");
	});

	it("minifies CSS", () => {
		const input = `
.test {
  color: red;
  margin: 10px 20px;
}`;
		const output = transformWithLightningCSS(input, { minify: true });
		expect(output).toBe(".test{color:red;margin:10px 20px}");
	});

	it("preserves source maps", () => {
		// Test source map generation
	});

	it("handles nesting", () => {
		const input = `
.parent {
  color: red;
  &:hover {
    color: blue;
  }
}`;
		const output = transformWithLightningCSS(input, { nesting: true });
		expect(output).toContain(".parent:hover");
	});
});
```

### 5.3 Integration Tests

**File**: `packages/compiler/src/__tests__/integration-lightningcss.test.ts`

```typescript
describe("Full Pipeline Integration", () => {
	it("generates CSS with LightningCSS postprocessing", () => {
		// Full pipeline test
	});

	it("works with vite plugin", () => {
		// Test vite plugin integration
	});

	it("works with CLI", () => {
		// Test CLI integration
	});
});
```

---

## Phase 6: Documentation

### 6.1 Update API Documentation

**File**: `docs/API.md`

Add sections:

- LightningCSS integration
- Compiler options
- Type-safe functions
- Media query builders

### 6.2 Create Migration Guide

**File**: `docs/lightningcss-migration.md`

Explain:

- How LightningCSS postprocessing works
- New types available
- Migration path from old CSS generation

---

## Gap Analysis: Current vs LightningCSS

| Category                | Current                                    | LightningCSS                                                                   | Priority                    |
| ----------------------- | ------------------------------------------ | ------------------------------------------------------------------------------ | --------------------------- |
| **Length Units**        | 18 units (px, rem, Q, container, viewport) | 40+ units (all CSS standard units)                                             | 🔴 High                     |
| **Color Types**         | `Schema.String`                            | RGB, HSL, LAB, OKLCH, LightDark, SystemColor, PredefinedColor, UnresolvedColor | 🔴 High                     |
| **Math Functions**      | None                                       | calc, min, max, clamp, round, rem, mod, abs, sign, hypot                       | 🔴 High                     |
| **Gradients**           | None                                       | Linear, Radial, Conic, WebKit variants                                         | 🟡 Medium                   |
| **Transform Functions** | None                                       | rotate, scale, translate, skew, matrix variants                                | 🟡 Medium                   |
| **Media Query Types**   | None                                       | MediaCondition, QueryFeature, MediaFeatureValue (30+ features)                 | 🟡 Medium                   |
| **Properties**          | 585 functions                              | ~400 PropertyId union members (different coverage)                             | 🟢 Low (different approach) |

---

## File Structure Changes

```
packages/compiler/src/
├── postprocess/
│   ├── lightningcss.ts          # LightningCSS integration
│   └── index.ts                # Postprocessing pipeline
├── types/
│   └── lightningcss-reference.ts # LightningCSS AST types (reference only)
└── [existing files modified]

packages/cssints/scripts/
├── compare-lightningcss.ts      # Gap analysis tool
├── validate-schema-completeness.ts # Schema validation
├── generate-function-schemas.ts # Function type generator
├── generate-media-types.ts      # Media query type generator
└── [existing scripts enhanced]

packages/cssints/src/generated/
├── functions.gen.ts             # Generated function types
├── media.gen.ts                # Generated media query types
├── types.bcd.gen.ts            # Enhanced BCD types
└── [existing files]

docs/
├── lightningcss-migration.md    # Migration guide
└── API.md                     # Updated with LightningCSS section
```

---

## Questions & Trade-offs

### 1. LightningCSS Runtime Dependency

- **Pro**: Production-ready CSS optimization, vendor prefixing, modern features
- **Con**: Adds ~200KB to bundle size
- **Decision**: Optional via `compilerOptions.lightningcss`, default enabled for production

### 2. Type Generation Priority

- **Option A**: Fill all gaps at once (large PR, long review)
- **Option B**: Incremental by category (length → colors → functions)
- **Recommendation**: Option B, start with length units and color types (highest impact)

### 3. BCD vs LightningCSS Types

- **Decision**: Keep BCD as primary source (your current approach), use LightningCSS AST as reference for completeness validation
- **Rationale**: BCD has browser compatibility data already integrated

### 4. Postprocessing Stage

- **Development**: Disable LightningCSS for faster builds, use raw CSS
- **Production**: Enable LightningCSS for optimization
- **Implementation**: Toggle via `compilerOptions.lightningcss` based on environment

---

## Implementation Priority

### Sprint 1: Foundation (1-2 days)

1. ✅ Create gap analysis tool (`compare-lightningcss.ts`)
2. ✅ Generate gap analysis report
3. ✅ Install LightningCSS dependency
4. ✅ Create `postprocess/lightningcss.ts`

### Sprint 2: Basic Integration (2-3 days)

1. ✅ Integrate into `compiler.ts:generateCSS()`
2. ✅ Integrate into `oxc-plugin.ts`
3. ✅ Integrate into `cli.ts`
4. ✅ Add basic tests

### Sprint 3: Type Enhancements - Part 1 (3-4 days)

1. ✅ Enhance length units (add missing ~22 units)
2. ✅ Add basic color types (RGB, HSL, Hex)
3. ✅ Update BCD generator for nested types
4. ✅ Regenerate schemas

### Sprint 4: Type Enhancements - Part 2 (3-4 days)

1. ✅ Add modern color types (OKLCH, OKLAB, LightDark)
2. ✅ Add math function types (calc, min, max, clamp)
3. ✅ Generate function schemas
4. ✅ Add tests for new types

### Sprint 5: Advanced Features (2-3 days)

1. ✅ Add gradient types
2. ✅ Add transform function types
3. ✅ Add media query type builders
4. ✅ Documentation updates

### Sprint 6: Polish & Optimization (1-2 days)

1. ✅ Performance testing
2. ✅ Source map validation
3. ✅ Migration guide
4. ✅ API documentation

**Total Estimated Time**: 12-18 days

---

## Benefits

### Type Safety

- Complete CSS value type coverage
- Prevents invalid CSS values at compile time
- Better IDE autocomplete and error messages

### Production Optimization

- Automatic vendor prefixing
- CSS minification
- Modern feature support (nesting, custom properties)
- Optimized output size

### Developer Experience

- Type-safe media query builders
- Typed CSS functions
- Better error messages
- Incremental adoption path

### Maintainability

- BCD as primary source (your current approach)
- LightningCSS as reference and runtime
- Clear separation of concerns
- Comprehensive test coverage
