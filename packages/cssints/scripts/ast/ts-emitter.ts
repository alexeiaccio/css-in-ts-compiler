/**
 * TypeScript Emitter
 *
 * Generates TypeScript type definitions from CSS Type AST.
 */

import type {
	CSSValueType,
	CSSProperty,
	CSSFunction,
	PrimitiveType,
	CompositeType,
	EnumType,
	AliasType,
	TypeReference,
	CSSTypeAST,
	IDLType,
	IDLInterface,
	IDLEnum,
} from "./css-type-ast";
import { isPrimitive, isComposite, isEnum, isAlias } from "./css-type-ast";

// ============================================================================
// Emitter Configuration
// ============================================================================

export interface EmitterConfig {
	/** Header comment to include in generated file */
	header?: string;
	/** Whether to include JSDoc comments */
	jsdoc?: boolean;
	/** Whether to include deprecated markers */
	deprecated?: boolean;
	/** Module to import types from */
	typeImports?: Map<string, string>;
}

const DEFAULT_CONFIG: EmitterConfig = {
	header: `/**
 * CSS Types - AUTO-GENERATED
 * Do not edit manually. Run: bun run scripts/generate-all.ts
 */`,
	jsdoc: true,
	deprecated: true,
};

// ============================================================================
// Type Emitter
// ============================================================================

export function emitType(type: CSSValueType, config: EmitterConfig = DEFAULT_CONFIG): string {
	const lines: string[] = [];

	if (config.jsdoc && type.description) {
		lines.push(`/** ${type.description} */`);
	}

	if (isPrimitive(type)) {
		lines.push(emitPrimitiveType(type));
	} else if (isComposite(type)) {
		lines.push(emitCompositeType(type));
	} else if (isEnum(type)) {
		lines.push(emitEnumType(type));
	} else if (isAlias(type)) {
		lines.push(emitAliasType(type));
	}

	return lines.join("\n");
}

function emitPrimitiveType(type: PrimitiveType): string {
	const { name, tsType, units } = type;

	if (units && units.length > 0) {
		const unitTypes = units.map((u) => `\`\${number}${u}\``);
		return `export type ${name} = number | ${unitTypes.join(" | ")};`;
	}

	return `export type ${name} = ${tsType};`;
}

function emitCompositeType(type: CompositeType): string {
	const { name, members } = type;
	const memberTypes = members.map((m) => m.name);
	return `export type ${name} = ${memberTypes.join(" | ")};`;
}

function emitEnumType(type: EnumType): string {
	const { name, values } = type;
	const quoted = values.map((v) => `'${v}'`);
	return `export type ${name} = ${quoted.join(" | ")};`;
}

function emitAliasType(type: AliasType): string {
	const { name, target } = type;
	return `export type ${name} = ${target.name};`;
}

// ============================================================================
// Property Emitter
// ============================================================================

export function emitProperty(prop: CSSProperty, config: EmitterConfig = DEFAULT_CONFIG): string {
	const lines: string[] = [];

	if (config.jsdoc) {
		lines.push(`/** CSS \`${prop.name}\` property */`);
		if (prop.spec) {
			lines.push(`/** @spec ${prop.spec} */`);
		}
	}

	const valueType = resolveTypeRef(prop.valueType);
	lines.push(`export const ${camelCase(prop.name)}: (value: ${valueType}) => string = (value) => \`${prop.name}: \${value}\`;`);

	return lines.join("\n");
}

// ============================================================================
// Function Emitter
// ============================================================================

export function emitCSSFunction(fn: CSSFunction, config: EmitterConfig = DEFAULT_CONFIG): string {
	const lines: string[] = [];

	if (config.jsdoc) {
		lines.push(`/** CSS \`${fn.name}()\` function */`);
		if (fn.spec) {
			lines.push(`/** @spec ${fn.spec} */`);
		}
	}

	const params = fn.parameters.map((p) => {
		const type = resolveTypeRef(p.type);
		const optional = p.optional ? "?" : "";
		return `_${p.name}${optional}: ${type}`;
	});

	const args = fn.parameters.map((p) => `_${p.name}`);
	const returnType = resolveTypeRef(fn.returnType);

	lines.push(`export const fn${capitalize(fn.name)}: (${params.join(", ")}) => ${returnType} = (${args.join(", ")}) => \`${fn.name}(${args.join(", ")})\`;`);

	return lines.join("\n");
}

// ============================================================================
// IDL Type Emitter
// ============================================================================

export function emitIDLType(type: IDLType, config: EmitterConfig = DEFAULT_CONFIG): string {
	switch (type.type) {
		case "interface":
			return emitIDLInterface(type, config);
		case "idl-enum":
			return emitIDLEnum(type, config);
		default:
			return `// Unsupported IDL type: ${type.type}`;
	}
}

function emitIDLInterface(iface: IDLInterface, config: EmitterConfig): string {
	const lines: string[] = [];

	if (config.jsdoc && iface.description) {
		lines.push(`/** ${iface.description} */`);
	}

	lines.push(`export interface ${iface.name} {`);

	const seenNames = new Set<string>();
	for (const member of iface.members) {
		const type = resolveTypeRef(member.type);
		const optional = member.kind === "attribute" ? "" : "?";
		// Sanitize member name: font-family -> fontFamily
		let memberName = member.name.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
		
		// Skip duplicates (e.g., both fontFamily and font-family in IDL)
		if (seenNames.has(memberName)) continue;
		seenNames.add(memberName);

		if (member.kind === "attribute") {
			lines.push(`  ${memberName}: ${type};`);
		} else if (member.kind === "operation" && member.parameters) {
			const params = member.parameters.map((p) => {
				const pt = resolveTypeRef(p.type);
				const opt = p.optional ? "?" : "";
				// Sanitize parameter name too
				const paramName = p.name.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
				return `${paramName}${opt}: ${pt}`;
			});
			lines.push(`  ${memberName}(${params.join(", ")}): ${type};`);
		}
	}

	lines.push("}");
	return lines.join("\n");
}

function emitIDLEnum(enum_: IDLEnum, config: EmitterConfig): string {
	const lines: string[] = [];

	if (config.jsdoc && enum_.description) {
		lines.push(`/** ${enum_.description} */`);
	}

	const values = enum_.values.map((v) => `  "${v}"`).join(",\n");
	lines.push(`export enum ${enum_.name} {`);
	lines.push(values);
	lines.push("}");

	return lines.join("\n");
}

// ============================================================================
// Full AST Emitter
// ============================================================================

export function emitAST(ast: CSSTypeAST, config: EmitterConfig = DEFAULT_CONFIG): string {
	const sections: string[] = [];

	if (config.header) {
		sections.push(config.header);
	}

	// Value types
	if (ast.valueTypes.size > 0) {
		sections.push("// ============================================================================\n// CSS Value Types\n// ============================================================================\n");
		sections.push(...Array.from(ast.valueTypes.values()).map((t) => emitType(t, config)));
	}

	// Properties
	if (ast.properties.size > 0) {
		sections.push("\n// ============================================================================\n// CSS Properties\n// ============================================================================\n");
		sections.push(...Array.from(ast.properties.values()).map((p) => emitProperty(p, config)));
	}

	// Functions
	if (ast.functions.size > 0) {
		sections.push("\n// ============================================================================\n// CSS Functions\n// ============================================================================\n");
		sections.push(...Array.from(ast.functions.values()).map((f) => emitCSSFunction(f, config)));
	}

	return sections.join("\n\n");
}

// ============================================================================
// Utilities
// ============================================================================

function resolveTypeRef(ref: TypeReference): string {
	let type = ref.name;

	if (ref.genericArgs && ref.genericArgs.length > 0) {
		const args = ref.genericArgs.map(resolveTypeRef).join(", ");
		type = `${type}<${args}>`;
	}

	if (ref.array) {
		type = `${type}[]`;
	}

	if (ref.nullable) {
		type = `${type} | null`;
	}

	return type;
}

const RESERVED_WORDS = new Set([
	"break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete",
	"do", "else", "enum", "export", "extends", "false", "finally", "for", "function",
	"if", "import", "in", "instanceof", "new", "null", "return", "super", "switch",
	"this", "throw", "true", "try", "typeof", "var", "void", "while", "with", "yield",
	"let", "static", "implements", "interface", "package", "private", "protected", "public",
	"await", "abstract", "boolean", "byte", "char", "double", "final", "float", "goto",
	"int", "long", "native", "short", "synchronized", "throws", "transient", "volatile",
]);

function camelCase(str: string): string {
	const camel = str.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
	// Add underscore suffix to reserved words
	return RESERVED_WORDS.has(camel) ? `${camel}_` : camel;
}

function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================================================
// Split Output Emitters
// ============================================================================

/**
 * Emit IDL types to types.gen.ts
 */
export function emitIDLTypes(types: Map<string, IDLType>, config: EmitterConfig = DEFAULT_CONFIG): string {
	const lines: string[] = [];
	
	if (config.header) {
		lines.push(config.header);
	}
	
	lines.push(`/**
 * CSS IDL Types - AUTO-GENERATED
 * Generated from @webref/idl
 * Do not edit manually.
 */

`);

	// Emit interfaces
	const interfaces: IDLInterface[] = [];
	const dictionaries: any[] = [];
	const enums: IDLEnum[] = [];
	
	for (const [name, type] of types) {
		switch (type.type) {
			case "interface":
				interfaces.push(type);
				break;
			case "dictionary":
				dictionaries.push(type);
				break;
			case "idl-enum":
				enums.push(type);
				break;
		}
	}

	// Interfaces section
	if (interfaces.length > 0) {
		lines.push("// ============================================================================");
		lines.push("// CSS Typed OM Interfaces");
		lines.push("// ============================================================================\n");

		for (const iface of interfaces) {
			lines.push(emitIDLInterface(iface, config));
			lines.push("");
		}
	}

	// Dictionaries section
	if (dictionaries.length > 0) {
		lines.push("// ============================================================================");
		lines.push("// CSS Dictionaries");
		lines.push("// ============================================================================\n");

		for (const dict of dictionaries) {
			lines.push(emitIDLDictionary(dict, config));
			lines.push("");
		}
	}

	// Enums section
	if (enums.length > 0) {
		lines.push("// ============================================================================");
		lines.push("// CSS Enums");
		lines.push("// ============================================================================\n");

		for (const enum_ of enums) {
			lines.push(emitIDLEnum(enum_, config));
			lines.push("");
		}
	}

	return lines.join("\n");
}

/**
 * Emit dictionary type
 */
function emitIDLDictionary(dict: any, config: EmitterConfig): string {
	const lines: string[] = [];

	if (config.jsdoc && dict.description) {
		lines.push(`/** ${dict.description} */`);
	}

	lines.push(`export interface ${dict.name} {`);

	for (const member of dict.members) {
		const type = resolveTypeRef(member.type);
		// Sanitize member name: font-family -> fontFamily
		const memberName = member.name.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
		lines.push(`  ${memberName}${member.required ? "" : "?"}: ${type};`);
	}

	lines.push("}");
	return lines.join("\n");
}

/**
 * Emit syntax types to syntax.gen.ts
 */
export function emitSyntaxTypes(types: Map<string, CSSValueType>, config: EmitterConfig = DEFAULT_CONFIG): string {
	const lines: string[] = [];
	
	if (config.header) {
		lines.push(config.header);
	}
	
	lines.push(`/**
 * CSS Syntax Types - AUTO-GENERATED
 * Generated from mdn-data/css/syntaxes.json
 * Do not edit manually.
 */

`);

	lines.push("// ============================================================================");
	lines.push("// CSS Value Types");
	lines.push("// ============================================================================\n");

	for (const [name, type] of types) {
		lines.push(emitType(type, config));
		lines.push("");
	}

	return lines.join("\n");
}

/**
 * Emit browser compat data to compat.gen.ts
 */
export function emitCompatData(config: EmitterConfig = DEFAULT_CONFIG): string {
	const lines: string[] = [];
	
	if (config.header) {
		lines.push(config.header);
	}
	
	lines.push(`/**
 * CSS Browser Compatibility - AUTO-GENERATED
 * Generated from @mdn/browser-compat-data
 * Do not edit manually.
 */

`);

	lines.push("// ============================================================================");
	lines.push("// Browser Support Metadata");
	lines.push("// ============================================================================\n");

	lines.push("// TODO: Implement browser compat data extraction\n");
	lines.push("export type BrowserSupport = {};\n");

	return lines.join("\n");
}

/**
 * Emit properties to properties.gen.ts
 */
export function emitProperties(properties: Map<string, CSSProperty>, config: EmitterConfig = DEFAULT_CONFIG): string {
	const lines: string[] = [];
	
	if (config.header) {
		lines.push(config.header);
	}
	
	lines.push(`/**
 * CSS Properties - AUTO-GENERATED
 * Generated from @webref/css
 * Do not edit manually.
 */

`);

	lines.push("// ============================================================================");
	lines.push("// CSS Property Functions");
	lines.push("// ============================================================================\n");

	for (const [name, prop] of properties) {
		lines.push(emitProperty(prop, config));
		lines.push("");
	}

	return lines.join("\n");
}

/**
 * Emit functions to functions.gen.ts
 */
export function emitFunctions(functions: Map<string, CSSFunction>, config: EmitterConfig = DEFAULT_CONFIG): string {
	const lines: string[] = [];
	
	if (config.header) {
		lines.push(config.header);
	}
	
	lines.push(`/**
 * CSS Functions - AUTO-GENERATED
 * Generated from @webref/css
 * Do not edit manually.
 */

`);

	lines.push("// ============================================================================");
	lines.push("// CSS Function Types");
	lines.push("// ============================================================================\n");

	for (const [name, fn] of functions) {
		// Sanitize function name: anchor-size -> AnchorSize
		const fnName = capitalize(fn.name).replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
		if (config.jsdoc) {
			lines.push(`/** CSS \`${fn.name}()\` function */`);
		}
		lines.push(`export type ${fnName}Function = (value: string) => string;`);
		lines.push("");
	}

	return lines.join("\n");
}
