/**
 * CSS Type AST - Intermediate Representation
 *
 * Decouples parsing (from WebIDL, WebRef CSS, MDN data) from emission (TypeScript types).
 * Inspired by TypeScript-DOM-lib-generator's Browser.WebIdl format.
 */

// ============================================================================
// Base AST Types
// ============================================================================

export interface BaseNode {
	readonly type: string;
	readonly name: string;
	readonly description?: string;
	readonly spec?: string;
	readonly deprecated?: boolean;
	readonly experimental?: boolean;
}

// ============================================================================
// CSS Value Types (from CSS syntax definitions)
// ============================================================================

export interface PrimitiveType extends BaseNode {
	readonly type: "primitive";
	readonly tsType: string;
	readonly units?: readonly string[];
}

export interface CompositeType extends BaseNode {
	readonly type: "composite";
	readonly members: readonly TypeReference[];
}

export interface EnumType extends BaseNode {
	readonly type: "enum";
	readonly values: readonly string[];
}

export interface AliasType extends BaseNode {
	readonly type: "alias";
	readonly target: TypeReference;
}

export type CSSValueType = PrimitiveType | CompositeType | EnumType | AliasType;

// ============================================================================
// CSS Properties
// ============================================================================

export interface CSSProperty extends BaseNode {
	readonly type: "property";
	readonly syntax: string;
	readonly valueType: TypeReference;
	readonly initial?: string;
	readonly inherited?: boolean;
	readonly animatable?: boolean;
}

// ============================================================================
// CSS Functions
// ============================================================================

export interface CSSFunction extends BaseNode {
	readonly type: "function";
	readonly syntax: string;
	readonly parameters: readonly Parameter[];
	readonly returnType: TypeReference;
}

export interface Parameter {
	readonly name: string;
	readonly type: TypeReference;
	readonly optional: boolean;
	readonly variadic: boolean;
	readonly description?: string;
}

// ============================================================================
// Type References
// ============================================================================

export interface TypeReference {
	readonly name: string;
	readonly nullable?: boolean;
	readonly array?: boolean;
	readonly genericArgs?: readonly TypeReference[];
}

// ============================================================================
// IDL Types (from WebIDL parsing)
// ============================================================================

export interface IDLInterface extends BaseNode {
	readonly type: "interface";
	readonly members: readonly IDLMember[];
	readonly mixins?: readonly string[];
}

export interface IDLDictionary extends BaseNode {
	readonly type: "dictionary";
	readonly members: readonly IDLField[];
	readonly inherits?: string;
}

export interface IDLEnum extends BaseNode {
	readonly type: "idl-enum";
	readonly values: readonly string[];
}

export interface IDLTypedef extends BaseNode {
	readonly type: "typedef";
	readonly target: TypeReference;
}

export interface IDLNamespace extends BaseNode {
	readonly type: "namespace";
	readonly members: readonly IDLFunction[];
}

export interface IDLCallback extends BaseNode {
	readonly type: "callback";
	readonly parameters: readonly Parameter[];
	readonly returnType: TypeReference;
}

export type IDLType = IDLInterface | IDLDictionary | IDLEnum | IDLTypedef | IDLNamespace | IDLCallback;

export interface IDLMember {
	readonly name: string;
	readonly kind: "attribute" | "operation" | "constant";
	readonly type: TypeReference;
	readonly parameters?: readonly Parameter[];
	readonly readonly?: boolean;
	readonly static?: boolean;
	readonly description?: string;
}

export interface IDLField {
	readonly name: string;
	readonly type: TypeReference;
	readonly required: boolean;
	readonly default?: string;
	readonly description?: string;
}

export interface IDLFunction {
	readonly name: string;
	readonly parameters: readonly Parameter[];
	readonly returnType: TypeReference;
	readonly description?: string;
}

// ============================================================================
// Root AST Container
// ============================================================================

export interface CSSTypeAST {
	readonly version: string;
	readonly generatedAt: string;
	
	// CSS value types (from mdn-data syntaxes)
	readonly valueTypes: Map<string, CSSValueType>;
	
	// CSS properties (from @webref/css)
	readonly properties: Map<string, CSSProperty>;
	
	// CSS functions (from @webref/css)
	readonly functions: Map<string, CSSFunction>;
	
	// IDL types (from @webref/idl)
	readonly idlTypes: Map<string, IDLType>;
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createPrimitiveType(
	name: string,
	tsType: string,
	units?: readonly string[],
	options?: { description?: string; spec?: string },
): PrimitiveType {
	return {
		type: "primitive",
		name,
		tsType,
		units,
		...options,
	};
}

export function createCompositeType(
	name: string,
	members: readonly TypeReference[],
	options?: { description?: string; spec?: string },
): CompositeType {
	return {
		type: "composite",
		name,
		members,
		...options,
	};
}

export function createEnumType(
	name: string,
	values: readonly string[],
	options?: { description?: string; spec?: string },
): EnumType {
	return {
		type: "enum",
		name,
		values,
		...options,
	};
}

export function createCSSProperty(
	name: string,
	syntax: string,
	valueType: TypeReference,
	options?: {
		description?: string;
		spec?: string;
		initial?: string;
		inherited?: boolean;
		animatable?: boolean;
	},
): CSSProperty {
	return {
		type: "property",
		name,
		syntax,
		valueType,
		...options,
	};
}

export function createCSSFunction(
	name: string,
	syntax: string,
	parameters: readonly Parameter[],
	returnType: TypeReference,
	options?: { description?: string; spec?: string },
): CSSFunction {
	return {
		type: "function",
		name,
		syntax,
		parameters,
		returnType,
		...options,
	};
}

export function createTypeRef(
	name: string,
	options?: { nullable?: boolean; array?: boolean; genericArgs?: readonly TypeReference[] },
): TypeReference {
	return {
		name,
		...options,
	};
}

// ============================================================================
// Known Primitive Types
// ============================================================================

export const KNOWN_PRIMITIVES: Record<string, PrimitiveType> = {
	number: createPrimitiveType("number", "number"),
	integer: createPrimitiveType("integer", "number"),
	length: createPrimitiveType("length", "Length", ["px", "rem", "em", "vh", "vw", "vmin", "vmax"]),
	angle: createPrimitiveType("angle", "Angle", ["deg", "rad", "grad", "turn"]),
	time: createPrimitiveType("time", "Time", ["s", "ms"]),
	frequency: createPrimitiveType("frequency", "Frequency", ["Hz", "kHz"]),
	resolution: createPrimitiveType("resolution", "Resolution", ["dpi", "dppx"]),
	percentage: createPrimitiveType("percentage", "Percentage"),
	color: createPrimitiveType("color", "Color"),
	string: createPrimitiveType("string", "string"),
	url: createPrimitiveType("url", "Url"),
	image: createPrimitiveType("image", "Image"),
	position: createPrimitiveType("position", "Position"),
};

// ============================================================================
// AST Utilities
// ============================================================================

export function isPrimitive(node: CSSValueType): node is PrimitiveType {
	return node.type === "primitive";
}

export function isComposite(node: CSSValueType): node is CompositeType {
	return node.type === "composite";
}

export function isEnum(node: CSSValueType): node is EnumType {
	return node.type === "enum";
}

export function isAlias(node: CSSValueType): node is AliasType {
	return node.type === "alias";
}

export function isProperty(node: CSSProperty | CSSFunction): node is CSSProperty {
	return node.type === "property";
}

export function isFunction(node: CSSProperty | CSSFunction): node is CSSFunction {
	return node.type === "function";
}
