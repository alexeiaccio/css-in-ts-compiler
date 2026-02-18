/**
 * CSS Type AST Module
 *
 * Exports all AST types and utilities for CSS type generation.
 */

// Core AST types
export type {
	BaseNode,
	PrimitiveType,
	CompositeType,
	EnumType,
	AliasType,
	CSSValueType,
	CSSProperty,
	CSSFunction,
	Parameter,
	TypeReference,
	IDLInterface,
	IDLDictionary,
	IDLEnum,
	IDLTypedef,
	IDLNamespace,
	IDLType,
	IDLMember,
	IDLField,
	IDLFunction,
	CSSTypeAST,
} from "./css-type-ast";

// Factory functions
export {
	createPrimitiveType,
	createCompositeType,
	createEnumType,
	createCSSProperty,
	createCSSFunction,
	createTypeRef,
	KNOWN_PRIMITIVES,
	isPrimitive,
	isComposite,
	isEnum,
	isAlias,
	isProperty,
	isFunction,
} from "./css-type-ast";

// IDL Parser
export {
	parseWebIDL,
	extractCSSTypesFromIDL,
	type IDLParseResult,
} from "./idl-parser";

// TypeScript Emitter
export {
	emitType,
	emitProperty,
	emitCSSFunction,
	emitIDLType,
	emitAST,
	type EmitterConfig,
} from "./ts-emitter";
