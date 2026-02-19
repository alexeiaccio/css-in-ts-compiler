/**
 * CSS IDL Type Extractor
 *
 * Extracts CSS-specific types from WebIDL data.
 * Filters IDL files and types relevant to CSS Typed OM and CSS properties.
 */

import type { IDLCollection } from "./collect-idl";
import { parseWebIDL, type IDLParseResult } from "./ast/idl-parser";
import type { IDLType } from "./ast/css-type-ast";

// CSS-related IDL specifications to extract from
const CSS_IDL_SPECS = [
	// Core CSS Typed OM
	"css-typed-om",
	"css-typed-om-2",
	
	// CSS Animation/Transition
	"web-animations",
	"web-animations-2",
	"css-transitions",
	"css-animations",
	
	// CSS Layout
	"css-layout-api",
	
	// CSS Painting
	"css-paint-api",
	
	// CSS Custom Highlight
	"css-custom-highlight-api",
	
	// CSS Properties and Values
	"css-properties-values-api",
	
	// CSS Object Model
	"cssom",
	"cssom-view",
];

// CSS-relevant interface names to extract
const CSS_INTERFACE_NAMES = new Set([
	// CSS Typed OM Base Classes
	"CSSStyleValue",
	"CSSNumericValue",
	"CSSUnitValue",
	"CSSKeywordValue",
	"CSSUnparsedValue",
	"CSSVariableReferenceValue",
	
	// CSS Math Values
	"CSSMathValue",
	"CSSMathSum",
	"CSSMathProduct",
	"CSSMathMin",
	"CSSMathMax",
	"CSSMathNegate",
	"CSSMathInvert",
	
	// CSS Transform Values
	"CSSTransformValue",
	"CSSTransformComponent",
	"CSSTranslate",
	"CSSRotate",
	"CSSScale",
	"CSSSkew",
	"CSSSkewX",
	"CSSSkewY",
	"CSSPerspective",
	"CSSMatrixComponent",
	"CSSMatrix3DComponent",
	
	// CSS Color Values
	"CSSColorValue",
	"CSSHexColor",
	"CSSRGBColor",
	"CSSHSLColor",
	"CSSHWBColor",
	"CSSLCHColor",
	"CSSOKLCHColor",
	"CSSOKLabColor",
	"CSSColorLAB",
	
	// CSS Image Values
	"CSSImageValue",
	"CSSGradientValue",
	
	// CSS Position Values
	"CSSPositionValue",
	
	// CSS Font Values
	"CSSFontFaceDescriptors",
	
	// Style Property Maps
	"StylePropertyMap",
	"StylePropertyMapReadOnly",
	
	// CSS Animation Types
	"Animation",
	"AnimationEffect",
	"AnimationTimeline",
	"ComputedEffectTiming",
	"EffectTiming",
	"KeyframeEffect",
	"KeyframeAnimationOptions",
	"BaseKeyframe",
	
	// CSS Transition Types
	"TransitionEvent",
	
	// CSS Animation Events
	"AnimationEvent",
	
	// CSS Layout API
	"LayoutChild",
	"LayoutFragment",
	"LayoutConstraints",
	"LayoutEdges",
	"FragmentResultOptions",
	"IntrinsicSizesResultOptions",
	
	// CSS Paint API
	"PaintRenderingContext2D",
	"PaintSize",
	
	// CSS Custom Highlight
	"Highlight",
	"HighlightRegistry",
	
	// CSS OM Types
	"CSS",
	"CSSRule",
	"CSSStyleRule",
	"CSSStyleDeclaration",
	"CSSStyleSheet",
	"MediaList",
	"StyleSheet",
	"StyleSheetList",
	"LinkStyle",
	"ElementCSSInlineStyle",
]);

export interface CSSIDLExtraction {
	/** Map of all parsed IDL types from CSS-related specs */
	cssTypes: Map<string, IDLType>;
	
	/** Map of specifically CSS Typed OM classes */
	typedOMTypes: Map<string, IDLType>;
	
	/** Map of CSS property-related types */
	propertyTypes: Map<string, IDLType>;
	
	/** Map of CSS animation types */
	animationTypes: Map<string, IDLType>;
	
	/** Errors encountered during parsing */
	errors: Array<{ file: string; error: Error }>;
}

/**
 * Extract CSS-specific IDL types from the collection
 */
export function extractCSSIDLTypes(data: IDLCollection): CSSIDLExtraction {
	const result: CSSIDLExtraction = {
		cssTypes: new Map(),
		typedOMTypes: new Map(),
		propertyTypes: new Map(),
		animationTypes: new Map(),
		errors: [],
	};

	// Find CSS-related spec files
	const cssFiles = findCSSSpecFiles(data);
	
	console.log(`Extracting from ${cssFiles.size} CSS-related IDL files...`);

	// Parse each CSS-related file
	for (const [specName, content] of cssFiles) {
		try {
			const parseResult = parseWebIDL(content, specName);
			
			// Add errors to result
			result.errors.push(...parseResult.errors);
			
			// Process each type
			for (const [typeName, type] of parseResult.types) {
				// Categorize the type
				if (CSS_INTERFACE_NAMES.has(typeName)) {
					result.cssTypes.set(typeName, type);
					
					// Further categorize
					if (isTypedOMType(typeName)) {
						result.typedOMTypes.set(typeName, type);
					} else if (isAnimationType(typeName)) {
						result.animationTypes.set(typeName, type);
					} else if (isPropertyType(typeName)) {
						result.propertyTypes.set(typeName, type);
					}
				}
			}
		} catch (err) {
			result.errors.push({
				file: specName,
				error: err instanceof Error ? err : new Error(String(err)),
			});
		}
	}

	console.log(`  Extracted ${result.cssTypes.size} CSS types:`);
	console.log(`    - Typed OM: ${result.typedOMTypes.size}`);
	console.log(`    - Properties: ${result.propertyTypes.size}`);
	console.log(`    - Animation: ${result.animationTypes.size}`);

	return result;
}

/**
 * Find CSS-related spec files from the IDL collection
 */
function findCSSSpecFiles(data: IDLCollection): Map<string, string> {
	const cssFiles = new Map<string, string>();
	
	for (const [specName, content] of data.files) {
		// Check if spec name matches CSS patterns
		const isCSSSpec = CSS_IDL_SPECS.some(pattern => 
			specName.toLowerCase().includes(pattern.toLowerCase())
		);
		
		// Also check if content contains CSS-related interface definitions
		const hasCSSInterfaces = CSS_INTERFACE_NAMES.size > 0 && 
			Array.from(CSS_INTERFACE_NAMES).some(name => 
				content.includes(`interface ${name}`) ||
				content.includes(`interface mixin ${name}`) ||
				content.includes(`dictionary ${name}`)
			);
		
		if (isCSSSpec || hasCSSInterfaces) {
			cssFiles.set(specName, content);
		}
	}
	
	return cssFiles;
}

/**
 * Check if a type name is a CSS Typed OM type
 */
function isTypedOMType(name: string): boolean {
	return name.startsWith("CSS") && 
		(name.includes("Value") || 
		 name.includes("Style") ||
		 name === "StylePropertyMap" ||
		 name === "StylePropertyMapReadOnly");
}

/**
 * Check if a type name is an animation type
 */
function isAnimationType(name: string): boolean {
	return name.includes("Animation") ||
		name.includes("Keyframe") ||
		name === "EffectTiming" ||
		name === "ComputedEffectTiming" ||
		name === "AnimationTimeline" ||
		name === "AnimationEffect" ||
		name === "TransitionEvent" ||
		name === "AnimationEvent";
}

/**
 * Check if a type name is a property-related type
 */
function isPropertyType(name: string): boolean {
	return name.includes("Property") ||
		name.includes("StyleDeclaration") ||
		name.includes("StyleSheet") ||
		name.includes("CSSRule") ||
		name === "MediaList";
}

/**
 * Get specific CSS Typed OM types by category
 */
export function getTypedOMCategories(extraction: CSSIDLExtraction): {
	numeric: Map<string, IDLType>;
	transform: Map<string, IDLType>;
	color: Map<string, IDLType>;
	image: Map<string, IDLType>;
	misc: Map<string, IDLType>;
} {
	const categories = {
		numeric: new Map<string, IDLType>(),
		transform: new Map<string, IDLType>(),
		color: new Map<string, IDLType>(),
		image: new Map<string, IDLType>(),
		misc: new Map<string, IDLType>(),
	};
	
	for (const [name, type] of extraction.typedOMTypes) {
		if (name.includes("Numeric") || name.includes("Math") || name.includes("Unit")) {
			categories.numeric.set(name, type);
		} else if (name.includes("Transform")) {
			categories.transform.set(name, type);
		} else if (name.includes("Color")) {
			categories.color.set(name, type);
		} else if (name.includes("Image")) {
			categories.image.set(name, type);
		} else {
			categories.misc.set(name, type);
		}
	}
	
	return categories;
}

// CLI entry point
if (import.meta.main) {
	import("./collect-idl").then(({ getIDLData }) => {
		getIDLData()
			.then((data) => {
				const extraction = extractCSSIDLTypes(data);
				
				console.log("\n=== CSS Typed OM Types ===");
				const categories = getTypedOMCategories(extraction);
				
				console.log("\nNumeric Types:");
				for (const name of categories.numeric.keys()) {
					console.log(`  - ${name}`);
				}
				
				console.log("\nTransform Types:");
				for (const name of categories.transform.keys()) {
					console.log(`  - ${name}`);
				}
				
				console.log("\nColor Types:");
				for (const name of categories.color.keys()) {
					console.log(`  - ${name}`);
				}
				
				if (extraction.errors.length > 0) {
					console.log(`\n⚠️  ${extraction.errors.length} errors during extraction`);
				}
			})
			.catch((err) => {
				console.error("Failed:", err);
				process.exit(1);
			});
	});
}
