/**
 * IDL Parser
 *
 * Parses WebIDL files using webidl2 and converts to our CSS Type AST format.
 * Inspired by TypeScript-DOM-lib-generator's widlprocess.ts.
 */

import { parse as parseIDL, type IDLRootType, type InterfaceType, type DictionaryType, type EnumType, type TypedefType, type NamespaceType, type IDLTypeDescription, type Argument } from "webidl2";
import type {
	IDLInterface,
	IDLDictionary,
	IDLEnum,
	IDLTypedef,
	IDLNamespace,
	IDLType,
	IDLMember,
	IDLField,
	IDLFunction,
	TypeReference,
	Parameter,
	CSSTypeAST,
	CSSValueType,
} from "./css-type-ast";
import {
	createTypeRef,
	createPrimitiveType,
} from "./css-type-ast";

// ============================================================================
// IDL AST Conversion
// ============================================================================

export interface IDLParseResult {
	types: Map<string, IDLType>;
	errors: Array<{ file: string; error: Error }>;
}

export function parseWebIDL(idlText: string, sourceName: string): IDLParseResult {
	const types = new Map<string, IDLType>();
	const errors: Array<{ file: string; error: Error }> = [];

	try {
		const ast = parseIDL(idlText);

		for (const node of ast) {
			try {
				const converted = convertIDLNode(node);
				if (converted) {
					types.set(converted.name, converted);
				}
			} catch (err) {
				errors.push({
					file: sourceName,
					error: err instanceof Error ? err : new Error(String(err)),
				});
			}
		}
	} catch (err) {
		errors.push({
			file: sourceName,
			error: err instanceof Error ? err : new Error(String(err)),
		});
	}

	return { types, errors };
}

function convertIDLNode(node: IDLRootType): IDLType | null {
	switch (node.type) {
		case "interface":
		case "interface mixin":
			return convertInterface(node as InterfaceType);
		case "dictionary":
			return convertDictionary(node as DictionaryType);
		case "enum":
			return convertEnum(node as EnumType);
		case "typedef":
			return convertTypedef(node as TypedefType);
		case "namespace":
			return convertNamespace(node as NamespaceType);
		case "callback":
		case "callback interface":
			return null;
		case "includes":
			return null;
		default:
			return null;
	}
}

// ============================================================================
// Interface Conversion
// ============================================================================

function convertInterface(node: InterfaceType): IDLInterface {
	const members: IDLMember[] = [];

	for (const member of node.members ?? []) {
		const converted = convertInterfaceMember(member as any);
		if (converted) {
			members.push(converted);
		}
	}

	return {
		type: "interface",
		name: node.name,
		members,
		mixins: [],
		description: extractDescription(node.extAttrs),
	};
}

function convertInterfaceMember(member: any): IDLMember | null {
	const idlType = Array.isArray(member.idlType) ? member.idlType[0] : member.idlType;
	
	switch (member.type) {
		case "attribute":
			return {
				name: member.name ?? "",
				kind: "attribute",
				type: idlType ? convertType(idlType) : createTypeRef("any"),
				readonly: member.readonly ?? false,
				static: false,
				description: extractDescription(member.extAttrs),
			};
		case "operation":
			return {
				name: member.name ?? "",
				kind: "operation",
				type: idlType ? convertType(idlType) : createTypeRef("any"),
				parameters: (member.arguments ?? []).map(convertArgument),
				static: false,
				description: extractDescription(member.extAttrs),
			};
		case "const":
			return {
				name: member.name ?? "",
				kind: "constant",
				type: idlType ? convertType(idlType) : createTypeRef("any"),
				description: extractDescription(member.extAttrs),
			};
		default:
			return null;
	}
}

// ============================================================================
// Dictionary Conversion
// ============================================================================

function convertDictionary(node: DictionaryType): IDLDictionary {
	const members: IDLField[] = [];

	for (const member of node.members ?? []) {
		if (member.type === "field" && member.idlType) {
			members.push({
				name: member.name ?? "",
				type: convertType(member.idlType),
				required: member.required ?? false,
				default: member.default ? String(member.default) : undefined,
				description: extractDescription(member.extAttrs),
			});
		}
	}

	return {
		type: "dictionary",
		name: node.name,
		members,
		inherits: node.inheritance ?? undefined,
		description: extractDescription(node.extAttrs),
	};
}

// ============================================================================
// Enum Conversion
// ============================================================================

function convertEnum(node: EnumType): IDLEnum {
	const values = (node.values ?? [])
		.filter((v: any) => v.type === "enum-value")
		.map((v: any) => v.value);

	return {
		type: "idl-enum",
		name: node.name,
		values,
		description: extractDescription(node.extAttrs),
	};
}

// ============================================================================
// Typedef Conversion
// ============================================================================

function convertTypedef(node: TypedefType): IDLTypedef {
	return {
		type: "typedef",
		name: node.name,
		target: node.idlType ? convertType(node.idlType) : createTypeRef("any"),
		description: extractDescription(node.extAttrs),
	};
}

// ============================================================================
// Namespace Conversion
// ============================================================================

function convertNamespace(node: NamespaceType): IDLNamespace {
	const members: IDLFunction[] = [];

	for (const member of node.members ?? []) {
		if (member.type === "operation" && member.idlType) {
			members.push({
				name: member.name ?? "",
				parameters: (member.arguments ?? []).map(convertArgument),
				returnType: convertType(member.idlType),
				description: extractDescription(member.extAttrs),
			});
		}
	}

	return {
		type: "namespace",
		name: node.name,
		members,
		description: extractDescription(node.extAttrs),
	};
}

// ============================================================================
// Type Conversion
// ============================================================================

function convertType(idlType: IDLTypeDescription): TypeReference {
	// Handle union types
	if ("union" in idlType && idlType.union) {
		const types = ((idlType as any).idlType as IDLTypeDescription[]).filter(Boolean);
		if (types.length === 1 && types[0]) {
			return convertType(types[0]);
		}
		return createTypeRef("string");
	}

	// Handle generic types
	if ("generic" in idlType && idlType.generic) {
		const args = (idlType as any).idlType;
		const genericArgs = Array.isArray(args)
			? args.filter(Boolean).map((t: IDLTypeDescription) => convertType(t))
			: args
			  ? [convertType(args as IDLTypeDescription)]
			  : [];
		return createTypeRef(mapIDLTypeToTS(idlType.generic), { genericArgs });
	}

	// Handle nullable types
	if ("nullable" in idlType && idlType.nullable) {
		const inner = (idlType as any).idlType;
		if (inner && typeof inner === "object" && !Array.isArray(inner)) {
			const innerType = convertType(inner as IDLTypeDescription);
			return createTypeRef(innerType.name, { nullable: true });
		}
		return createTypeRef("any", { nullable: true });
	}

	// Simple type - extract type name
	if ("idlType" in idlType) {
		const type = (idlType as any).idlType;
		if (typeof type === "string") {
			return createTypeRef(mapIDLTypeToTS(type));
		}
		if (Array.isArray(type) && type.length > 0 && type[0]) {
			return convertType(type[0] as IDLTypeDescription);
		}
	}

	return createTypeRef("any");
}

function mapIDLTypeToTS(idlType: string): string {
	const typeMap: Record<string, string> = {
		boolean: "boolean",
		byte: "number",
		octet: "number",
		short: "number",
		"unsigned short": "number",
		long: "number",
		"unsigned long": "number",
		"long long": "number",
		"unsigned long long": "number",
		float: "number",
		"unrestricted float": "number",
		double: "number",
		"unrestricted double": "number",
		DOMString: "string",
		ByteString: "string",
		USVString: "string",
		CSSOMString: "string",
		any: "any",
		void: "void",
		undefined: "undefined",
		object: "object",
		CSSStyleValue: "CSSStyleValue",
		CSSNumericValue: "CSSNumericValue",
		CSSUnitValue: "CSSUnitValue",
		CSSKeywordValue: "CSSKeywordValue",
	};

	return typeMap[idlType] ?? idlType;
}

// ============================================================================
// Argument Conversion
// ============================================================================

function convertArgument(arg: Argument): Parameter {
	return {
		name: arg.name ?? "",
		type: arg.idlType ? convertType(arg.idlType) : createTypeRef("any"),
		optional: arg.optional ?? false,
		variadic: arg.variadic ?? false,
	};
}

// ============================================================================
// Utilities
// ============================================================================

function extractDescription(extAttrs?: any[]): string | undefined {
	if (!extAttrs) return undefined;
	return undefined;
}

// ============================================================================
// CSS-Specific Type Extraction
// ============================================================================

export function extractCSSTypesFromIDL(idlTypes: Map<string, IDLType>): CSSValueType[] {
	const cssTypes: CSSValueType[] = [];

	const numericEnum = idlTypes.get("CSSNumericBaseType");
	if (numericEnum && numericEnum.type === "idl-enum") {
		for (const value of numericEnum.values) {
			cssTypes.push(
				createPrimitiveType(value, mapCSSNumericTypeToTS(value), undefined, {
					description: `CSS ${value} type`,
				}),
			);
		}
	}

	return cssTypes;
}

function mapCSSNumericTypeToTS(cssType: string): string {
	const typeMap: Record<string, string> = {
		length: "Length",
		angle: "Angle",
		time: "Time",
		frequency: "Frequency",
		resolution: "Resolution",
		flex: "string",
		percent: "Percentage",
	};
	return typeMap[cssType] ?? "string";
}
