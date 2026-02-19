/**
 * CSS Token System
 *
 * Typed CSS custom properties with @property registration.
 * Supports all CSS primitive types with automatic syntax inference.
 */

// Type definitions (previously from generated-types)
export type CSSNumber = number;
export type CSSInteger = number;
export type Percentage = `${number}%`;
export type Length = number | `${number}${string}`;
export type Angle = number | `${number}deg` | `${number}rad` | `${number}grad` | `${number}turn`;
export type Time = `${number}s` | `${number}ms`;
export type Frequency = `${number}Hz` | `${number}kHz`;
export type Resolution = `${number}dpi` | `${number}dppx`;
export type LengthPercentage = Length | Percentage;
export type AnglePercentage = Angle | Percentage;
export type TimePercentage = Time | Percentage;
export type Color = string;

// ============================================================================
// Token Types
// ============================================================================

declare const __token: unique symbol;

export type Token<T, Name extends string> = `var(--${Name})` & { [__token]: T };

export type TokenType =
	| "color"
	| "length"
	| "angle"
	| "time"
	| "percentage"
	| "number"
	| "integer"
	| "frequency"
	| "resolution"
	| "length-percentage"
	| "angle-percentage"
	| "time-percentage"
	| "string"
	| "url"
	| "image"
	| "custom-ident";

export interface TokenOptions {
	/** CSS variable name (without --) */
	var: string;
	/** Whether the property inherits (default: true) */
	inherit?: boolean;
}

export interface TokenDefinition<T extends TokenType, Name extends string> {
	type: T;
	name: Name;
	cssName: `--${Name}`;
	syntax: string;
	inherits: boolean;
	initialValue: string;
	token: Token<CSSValueType<T>, Name>;
}

// ============================================================================
// CSS Type Mappings
// ============================================================================

export interface CSSTypeMap {
	color: Color;
	length: Length;
	angle: Angle;
	time: Time;
	percentage: Percentage;
	number: CSSNumber;
	integer: CSSInteger;
	frequency: Frequency;
	resolution: Resolution;
	"length-percentage": LengthPercentage;
	"angle-percentage": AnglePercentage;
	"time-percentage": TimePercentage;
	string: string;
	url: string;
	image: string;
	"custom-ident": string;
}

export type CSSValueType<T extends TokenType> = T extends keyof CSSTypeMap ? CSSTypeMap[T] : string;

export interface SyntaxMap {
	color: "<color>";
	length: "<length>";
	angle: "<angle>";
	time: "<time>";
	percentage: "<percentage>";
	number: "<number>";
	integer: "<integer>";
	frequency: "<frequency>";
	resolution: "<resolution>";
	"length-percentage": "<length-percentage>";
	"angle-percentage": "<angle-percentage>";
	"time-percentage": "<time-percentage>";
	string: "<string>";
	url: "<url>";
	image: "<image>";
	"custom-ident": "<custom-ident>";
}

// ============================================================================
// Token Registry (for @property generation)
// ============================================================================

const tokenRegistry = new Map<string, TokenDefinition<TokenType, string>>();

export function getRegisteredTokens(): TokenDefinition<TokenType, string>[] {
	return Array.from(tokenRegistry.values());
}

export function generatePropertyCSS(): string {
	const tokens = getRegisteredTokens();
	if (tokens.length === 0) return "";

	return tokens
		.map((t) => {
			return `@property ${t.cssName} {
\tsyntax: "${t.syntax}";
\tinherits: ${t.inherits};
\tinitial-value: ${t.initialValue};
}`;
		})
		.join("\n\n");
}

// ============================================================================
// Token Factories
// ============================================================================

type TokenValue<T extends TokenType> = CSSValueType<T> | string;

function createToken<T extends TokenType, Name extends string>(
	type: T,
	value: TokenValue<T>,
	options: string | TokenOptions,
): TokenDefinition<T, Name> {
	const opts = typeof options === "string" ? { var: options, inherit: true } : options;
	const name = opts.var as Name;
	const cssName = `--${name}` as const;
	const syntaxMap: Record<TokenType, string> = {
		color: "<color>",
		length: "<length>",
		angle: "<angle>",
		time: "<time>",
		percentage: "<percentage>",
		number: "<number>",
		integer: "<integer>",
		frequency: "<frequency>",
		resolution: "<resolution>",
		"length-percentage": "<length-percentage>",
		"angle-percentage": "<angle-percentage>",
		"time-percentage": "<time-percentage>",
		string: "<string>",
		url: "<url>",
		image: "<image>",
		"custom-ident": "<custom-ident>",
	};
	const syntax = syntaxMap[type] ?? "<string>";
	const inherits = opts.inherit ?? true;
	const initialValue = String(value);

	const token = `var(--${name})` as Token<CSSValueType<T>, Name>;

	const def: TokenDefinition<T, Name> = {
		type,
		name,
		cssName,
		syntax,
		inherits,
		initialValue,
		token,
	};

	tokenRegistry.set(name, def as TokenDefinition<TokenType, string>);

	return def;
}

// ============================================================================
// Color Tokens
// ============================================================================

export function color<Name extends string>(
	value: Color,
	options: string | TokenOptions,
): TokenDefinition<"color", Name> {
	return createToken("color", value, options);
}

// ============================================================================
// Length Tokens
// ============================================================================

export function length<Name extends string>(
	value: Length,
	options: string | TokenOptions,
): TokenDefinition<"length", Name> {
	return createToken("length", value, options);
}

export function pxToken<Name extends string>(value: number, options: string | TokenOptions) {
	return length(`${value}px` as Length, options);
}

export function remToken<Name extends string>(value: number, options: string | TokenOptions) {
	return length(`${value}rem` as Length, options);
}

export function emToken<Name extends string>(value: number, options: string | TokenOptions) {
	return length(`${value}em` as Length, options);
}

// ============================================================================
// Angle Tokens
// ============================================================================

export function angle<Name extends string>(
	value: Angle,
	options: string | TokenOptions,
): TokenDefinition<"angle", Name> {
	return createToken("angle", value, options);
}

export function degToken<Name extends string>(value: number, options: string | TokenOptions) {
	return angle(`${value}deg` as Angle, options);
}

export function turnToken<Name extends string>(value: number, options: string | TokenOptions) {
	return angle(`${value}turn` as Angle, options);
}

// ============================================================================
// Time Tokens
// ============================================================================

export function time<Name extends string>(
	value: Time,
	options: string | TokenOptions,
): TokenDefinition<"time", Name> {
	return createToken("time", value, options);
}

export function secToken<Name extends string>(value: number, options: string | TokenOptions) {
	return time(`${value}s` as Time, options);
}

export function msToken<Name extends string>(value: number, options: string | TokenOptions) {
	return time(`${value}ms` as Time, options);
}

// ============================================================================
// Percentage Tokens
// ============================================================================

export function percentage<Name extends string>(
	value: Percentage,
	options: string | TokenOptions,
): TokenDefinition<"percentage", Name> {
	return createToken("percentage", value, options);
}

// ============================================================================
// Number Tokens
// ============================================================================

export function number<Name extends string>(
	value: CSSNumber,
	options: string | TokenOptions,
): TokenDefinition<"number", Name> {
	return createToken("number", value, options);
}

export function integer<Name extends string>(
	value: CSSInteger,
	options: string | TokenOptions,
): TokenDefinition<"integer", Name> {
	return createToken("integer", value, options);
}

// ============================================================================
// Composite Tokens
// ============================================================================

export function lengthPercentage<Name extends string>(
	value: LengthPercentage,
	options: string | TokenOptions,
): TokenDefinition<"length-percentage", Name> {
	return createToken("length-percentage", value, options);
}

export function anglePercentage<Name extends string>(
	value: AnglePercentage,
	options: string | TokenOptions,
): TokenDefinition<"angle-percentage", Name> {
	return createToken("angle-percentage", value, options);
}

export function timePercentage<Name extends string>(
	value: TimePercentage,
	options: string | TokenOptions,
): TokenDefinition<"time-percentage", Name> {
	return createToken("time-percentage", value, options);
}

// ============================================================================
// String Tokens
// ============================================================================

export function string<Name extends string>(
	value: string,
	options: string | TokenOptions,
): TokenDefinition<"string", Name> {
	return createToken("string", value, options);
}

export function url<Name extends string>(
	value: string,
	options: string | TokenOptions,
): TokenDefinition<"url", Name> {
	return createToken("url", value, options);
}

export function image<Name extends string>(
	value: string,
	options: string | TokenOptions,
): TokenDefinition<"image", Name> {
	return createToken("image", value, options);
}

// ============================================================================
// Token Set (for inline styles)
// ============================================================================

export type TokenRef = Token<unknown, string>;

export function set<N extends string>(token: Token<unknown, N>, value: string): Record<`--${N}`, string> {
	// Extract variable name from var(--name)
	const match = token.match(/^var\(--(.+)\)$/);
	if (!match) {
		throw new Error(`Invalid token: ${token}`);
	}
	const name = match[1] as N;
	return { [`--${name}`]: value } as Record<`--${N}`, string>;
}

export function setMultiple(
	...pairs: [Token<unknown, string>, string][]
): Record<string, string> {
	return Object.assign({}, ...pairs.map(([token, value]) => set(token, value)));
}

// ============================================================================
// Style Builder (for inline styles)
// ============================================================================

export function style(
	...properties: Array<Record<string, string> | [Token<unknown, string>, string]>
): Record<string, string> {
	const result: Record<string, string> = {};

	for (const prop of properties) {
		if (Array.isArray(prop)) {
			Object.assign(result, set(prop[0], prop[1]));
		} else {
			Object.assign(result, prop);
		}
	}

	return result;
}

// ============================================================================
// Convenience Token Object
// ============================================================================

export const token = {
	color,
	length,
	angle,
	time,
	percentage,
	number,
	integer,
	lengthPercentage,
	anglePercentage,
	timePercentage,
	string,
	url,
	image,
	// Shorthands
	px: pxToken,
	rem: remToken,
	em: emToken,
	deg: degToken,
	turn: turnToken,
	sec: secToken,
	ms: msToken,
	// Utilities
	set,
	setMultiple,
	style,
};
