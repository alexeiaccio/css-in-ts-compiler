/**
 * Type Generator
 *
 * Generates ALL TypeScript type definitions from CSS spec data.
 * Includes primitive CSS value types and complex syntax types.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { camelCase } from "es-toolkit";
import syntaxes from "mdn-data/css/syntaxes.json" with { type: "json" };

const paths = JSON.parse(fs.readFileSync(path.join(__dirname, "paths.json"), "utf-8"));
const OUTPUT_FILE = path.resolve(path.join(__dirname, "..", paths.output.generatedTypes ?? "lib/generated-types.ts"));

interface SyntaxEntry {
	syntax?: string;
	prose?: string;
}

const RESERVED_WORDS = new Set([
	"if", "var", "let", "const", "function", "class", "interface", "type",
	"enum", "namespace", "module", "import", "export", "from", "as",
	"return", "throw", "new", "delete", "typeof", "void", "null", "undefined",
	"true", "false", "in", "of", "for", "while", "do", "switch", "case",
	"break", "continue", "default", "try", "catch", "finally", "with", "debugger",
	"symbol", "string", "number", "boolean", "object", "bigint", "any", "unknown",
	"never", "void", "null", "undefined", "readonly", "keyof", "infer",
]);

const PRIMITIVE_TYPES: Record<string, string> = {
	length: "Length",
	angle: "Angle",
	color: "Color",
	percentage: "Percentage",
	number: "CSSNumber",
	integer: "CSSInteger",
	time: "Time",
	string: "string",
	url: "URL",
	image: "Image",
	position: "Position",
	frequency: "Frequency",
	resolution: "Resolution",
};

function sanitizeTypeName(name: string): string {
	let camel = camelCase(name.replace(/\(\)/g, "").replace(/-/g, "_"));
	if (RESERVED_WORDS.has(camel)) {
		camel = `css${camel.charAt(0).toUpperCase()}${camel.slice(1)}`;
	}
	return camel;
}

function mapSyntaxToTS(syntax: string): string {
	if (syntax.includes("<length>") && syntax.includes("<percentage>")) return "LengthPercentage";
	if (syntax.includes("<angle>") && syntax.includes("<percentage>")) return "AnglePercentage";
	if (syntax.includes("<time>") && syntax.includes("<percentage>")) return "TimePercentage";
	if (syntax.includes("<length>")) return "Length";
	if (syntax.includes("<percentage>")) return "Percentage";
	if (syntax.includes("<color>")) return "Color";
	if (syntax.includes("<angle>")) return "Angle";
	if (syntax.includes("<time>")) return "Time";
	if (syntax.includes("<number>")) return "CSSNumber";
	if (syntax.includes("<integer>")) return "CSSInteger";
	if (syntax.includes("<string>")) return "string";
	if (syntax.includes("<url>")) return "URL";
	if (syntax.includes("<image>")) return "Image";
	return "string";
}

function generateType(name: string, entry: SyntaxEntry): { typeName: string; code: string } | null {
	const typeName = sanitizeTypeName(name);
	if (PRIMITIVE_TYPES[name]) return null;
	
	const syntax = entry.syntax ?? "";
	const tsType = mapSyntaxToTS(syntax);
	const description = entry.syntax ?? entry.prose ?? name;
	const code = `/** ${name}${description ? ` - ${description.slice(0, 100)}` : ""} */
export type ${typeName} = ${tsType};`;
	return { typeName, code };
}

function generatePrimitiveTypes(): string[] {
	const lines: string[] = [];
	
	lines.push(`// ============================================================================
// Primitive CSS Value Types
// ============================================================================

export type CSSNumber = number;
export type CSSInteger = number;

export type Percentage = \`\${number}%\`;

export type Px = \`\${number}px\`;
export type Rem = \`\${number}rem\`;
export type Em = \`\${number}em\`;
export type Ch = \`\${number}ch\`;
export type Vw = \`\${number}vw\`;
export type Vh = \`\${number}vh\`;
export type Vmin = \`\${number}vmin\`;
export type Vmax = \`\${number}vmax\`;

export type Length = CSSNumber | Px | Rem | Em | Ch | Vw | Vh | Vmin | Vmax | \`\${number}\${string}\`;

export type Deg = \`\${number}deg\`;
export type Rad = \`\${number}rad\`;
export type Grad = \`\${number}grad\`;
export type Turn = \`\${number}turn\`;

export type Angle = CSSNumber | Deg | Rad | Grad | Turn;

export type Seconds = \`\${number}s\`;
export type Milliseconds = \`\${number}ms\`;

export type Time = Seconds | Milliseconds;

export type Hz = \`\${number}Hz\`;
export type kHz = \`\${number}kHz\`;

export type Frequency = Hz | kHz;

export type Dpi = \`\${number}dpi\`;
export type Dppx = \`\${number}dppx\`;

export type Resolution = Dpi | Dppx;

export type Url = string;
export type Image = string;
export type Position = string;

// Named colors are just strings for now
export type NamedColor = string;
export type HexColor = \`#\${string}\`;
export type RgbColor = \`rgb(\${string})\`;
export type HslColor = \`hsl(\${string})\`;
export type OklchColor = \`oklch(\${string})\`;

export type Color = NamedColor | HexColor | RgbColor | HslColor | OklchColor | string;

// Composite types
export type LengthPercentage = Length | Percentage;
export type AnglePercentage = Angle | Percentage;
export type TimePercentage = Time | Percentage;

// Unit helpers (runtime values)
export const px = (v: number): Px => \`\${v}px\`;
export const rem = (v: number): Rem => \`\${v}rem\`;
export const em = (v: number): Em => \`\${v}em\`;
export const vw = (v: number): Vw => \`\${v}vw\`;
export const vh = (v: number): Vh => \`\${v}vh\`;
export const pct = (v: number): Percentage => \`\${v}%\`;
export const deg = (v: number): Deg => \`\${v}deg\`;
export const turn = (v: number): Turn => \`\${v}turn\`;
export const sec = (v: number): Seconds => \`\${v}s\`;
export const ms = (v: number): Milliseconds => \`\${v}ms\`;
`);

	return lines;
}

export function generateTypes(): void {
	console.log("Generating CSS types...");

	const lines: string[] = [];

	lines.push(`/**
 * CSS Types - AUTO-GENERATED
 * Do not edit manually. Run: bun run scripts/generate-all.ts
 * 
 * Generated from mdn-data/css/syntaxes.json
 */

`);

	lines.push(...generatePrimitiveTypes());

	lines.push(`
// ============================================================================
// CSS Syntax Types
// ============================================================================

`);

	const entries = Object.entries(syntaxes as Record<string, SyntaxEntry>);
	const typeMap = new Map<string, string>();

	for (const [name, entry] of entries) {
		if (name.startsWith("-") || name.startsWith("(") || name.endsWith("-token")) continue;
		const result = generateType(name, entry);
		if (result && !typeMap.has(result.typeName)) {
			typeMap.set(result.typeName, result.code);
		}
	}

	lines.push(...Array.from(typeMap.values()));

	fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
	fs.writeFileSync(OUTPUT_FILE, lines.join("\n\n"));

	console.log(`Generated ${typeMap.size} syntax types + primitives to ${OUTPUT_FILE}`);
}

// CLI entry point
if (import.meta.main) {
	generateTypes();
}
