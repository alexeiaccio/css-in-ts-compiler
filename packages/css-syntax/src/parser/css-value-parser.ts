import type { TokenValue } from "../lexer/token.js";

import { LexContext } from "../lexer/contexts.js";
import { Lexer } from "../lexer/index.js";
import { Token } from "../lexer/token.js";

export interface CSSValueOptions {
	onError?: (error: CSSValueError) => void;
}

export interface CSSValueError {
	message: string;
	token: TokenValue;
}

export type CSSValueNode =
	| KeywordNode
	| IdentNode
	| NumberNode
	| DimensionNode
	| PercentageNode
	| StringNode
	| UrlNode
	| FunctionNode
	| CompositeNode
	| ColorFunctionNode
	| ColorMixNode
	| LightDarkNode;

export interface KeywordNode {
	type: "keyword";
	value: string;
}

export interface IdentNode {
	type: "ident";
	value: string;
}

export interface NumberNode {
	type: "number";
	value: string;
	number: number;
}

export interface DimensionNode {
	type: "dimension";
	value: string;
	number: number;
	unit: string;
}

export interface PercentageNode {
	type: "percentage";
	value: string;
	number: number;
}

export interface StringNode {
	type: "string";
	value: string;
}

export interface UrlNode {
	type: "url";
	value: string;
}

export interface FunctionNode {
	type: "function";
	name: string;
	args: CSSValueNode[];
}

export interface CompositeNode {
	type: "composite";
	nodes: CSSValueNode[];
	combinator: " " | "|" | "||" | "&&";
}

export type ColorSpace =
	| "srgb"
	| "srgb-linear"
	| "display-p3"
	| "a98-rgb"
	| "prophoto-rgb"
	| "rec2020"
	| "xyz"
	| "xyz-d50"
	| "xyz-d65"
	| "oklch"
	| "oklab"
	| "lab"
	| "lch"
	| "hwb";

export interface ColorComponentNode {
	type: "color-component";
	value: number | string;
}

export interface ColorFunctionNode {
	type: "color-function";
	name: ColorSpace;
	components: ColorComponentNode[];
	alpha?: number;
}

export interface ColorFunctionNode {
	type: "color-function";
	name: ColorSpace;
	components: ColorComponentNode[];
	alpha?: number;
}

export interface ColorMixNode {
	type: "color-mix";
	mode: "in" | "in oklch" | "in srgb";
	color1: CSSValueNode;
	color2: CSSValueNode;
	weight1?: number;
	weight2?: number;
}

export interface LightDarkNode {
	type: "light-dark";
	light: CSSValueNode;
	dark: CSSValueNode;
}

export class CSSValueParser {
	private tokens: TokenValue[] = [];
	private pos = 0;
	private options: CSSValueOptions;

	constructor(options: CSSValueOptions = {}) {
		this.options = options;
	}

	parse(source: string, tokens?: readonly TokenValue[]): CSSValueNode {
		if (tokens) {
			this.tokens = tokens as TokenValue[];
		} else {
			this.tokenize(source);
		}
		this.pos = 0;

		if (this.tokens.length === 0) {
			return { type: "keyword", value: "" };
		}

		return this.parseComponentValue();
	}

	private tokenize(source: string): void {
		const lexer = new Lexer(source);

		this.tokens = [];
		let token: TokenValue;
		while ((token = lexer.next(LexContext.Normal)).token !== Token.EOF) {
			if (token.token !== Token.Whitespace && token.token !== Token.Comment) {
				this.tokens.push(token);
			}
		}
	}

	private peek(): TokenValue {
		return this.tokens[this.pos] ?? { token: Token.EOF, value: "", pos: 0, end: 0 };
	}

	private consume(): TokenValue {
		return this.tokens[this.pos++] ?? { token: Token.EOF, value: "", pos: 0, end: 0 };
	}

	private error(message: string): void {
		const error: CSSValueError = { message, token: this.peek() };
		this.options.onError?.(error);
	}

	private parseComponentValue(): CSSValueNode {
		const token = this.peek();

		switch (token.token) {
			case Token.Number:
				return this.parseNumber();
			case Token.Dimension:
				return this.parseDimension();
			case Token.Percentage:
				return this.parsePercentage();
			case Token.String:
				return this.parseString();
			case Token.Url:
				return this.parseUrl();
			case Token.Function:
				return this.parseFunction();
			case Token.Ident:
				return this.parseIdent();
			case Token.Hash:
				return this.parseHash();
			case Token.Delim:
				return this.parseDelim();
			default:
				this.consume();
				return { type: "keyword", value: token.value };
		}
	}

	private parseNumber(): NumberNode {
		const token = this.consume();
		return {
			type: "number",
			value: token.value,
			number: Number.parseFloat(token.value),
		};
	}

	private parseDimension(): DimensionNode {
		const token = this.consume();
		const match = token.value.match(/^(-?\d+\.?\d*)(.*)$/);
		return {
			type: "dimension",
			value: token.value,
			number: Number.parseFloat(match?.[1] ?? "0"),
			unit: match?.[2] ?? "",
		};
	}

	private parsePercentage(): PercentageNode {
		const token = this.consume();
		return {
			type: "percentage",
			value: token.value,
			number: Number.parseFloat(token.value),
		};
	}

	private parseString(): StringNode {
		const token = this.consume();
		return {
			type: "string",
			value: token.value,
		};
	}

	private parseUrl(): UrlNode {
		const token = this.consume();
		return {
			type: "url",
			value: token.value,
		};
	}

	private parseHash(): IdentNode {
		const token = this.consume();
		return {
			type: "ident",
			value: token.value,
		};
	}

	private parseDelim(): CSSValueNode {
		const token = this.consume();
		return {
			type: "keyword",
			value: token.value,
		};
	}

	private parseIdent(): CSSValueNode {
		const token = this.consume();

		if (this.peek().token === Token.LeftParen) {
			return this.parseFunctionWithName(token.value);
		}

		if (
			token.value === "inherit" ||
			token.value === "initial" ||
			token.value === "unset" ||
			token.value === "revert" ||
			token.value === "revert-layer" ||
			token.value === "auto" ||
			token.value === "none" ||
			token.value === "normal" ||
			token.value === "solid" ||
			token.value === "dashed" ||
			token.value === "dotted" ||
			token.value === "hidden" ||
			token.value === "visible" ||
			token.value === "absolute" ||
			token.value === "relative" ||
			token.value === "fixed" ||
			token.value === "static"
		) {
			return { type: "keyword", value: token.value };
		}

		return { type: "ident", value: token.value };
	}

	private parseFunctionWithName(name: string): FunctionNode | ColorFunctionNode | ColorMixNode | LightDarkNode {
		this.consume();

		const args: CSSValueNode[] = [];
		while (this.peek().token !== Token.RightParen && this.peek().token !== Token.EOF) {
			args.push(this.parseComponentValue());
		}

		if (this.peek().token === Token.RightParen) {
			this.consume();
		}

		const lowerName = name.toLowerCase();

		if (
			lowerName === "oklch" ||
			lowerName === "oklab" ||
			lowerName === "lab" ||
			lowerName === "lch" ||
			lowerName === "hwb" ||
			lowerName === "p3" ||
			lowerName === "rec2020" ||
			lowerName === "a98-rgb" ||
			lowerName === "prophoto-rgb" ||
			lowerName === "xyz-d50" ||
			lowerName === "xyz-d65" ||
			lowerName === "xyz" ||
			lowerName === "srgb-linear" ||
			lowerName === "srgb" ||
			lowerName === "color"
		) {
			return this.parseColorFunction(name, args);
		}

		if (lowerName === "color-mix") {
			return this.parseColorMix(args);
		}

		if (lowerName === "light-dark") {
			return this.parseLightDark(args);
		}

		return { type: "function", name, args };
	}

	private parseColorFunction(name: string, args: CSSValueNode[]): ColorFunctionNode {
		const components: ColorComponentNode[] = [];
		let alpha: number | undefined;

		for (const arg of args) {
			if (arg.type === "number" || arg.type === "dimension" || arg.type === "percentage") {
				let value: number;
				if (arg.type === "number") {
					value = arg.number;
				} else if (arg.type === "percentage") {
					value = arg.number;
				} else {
					value = arg.number;
				}
				components.push({ type: "color-component", value });
			} else if (arg.type === "keyword" || arg.type === "ident") {
				components.push({ type: "color-component", value: arg.value });
			}
		}

		if (components.length > 3 && typeof components[components.length - 1]!.value === "number") {
			const last = components[components.length - 1]!;
			if (typeof last.value === "number" && last.value > 1) {
				alpha = last.value > 1 ? last.value / 100 : undefined;
				components.pop();
			}
		}

		return {
			type: "color-function",
			name: name as ColorSpace,
			components,
			alpha,
		};
	}

	private parseColorMix(args: CSSValueNode[]): ColorMixNode {
		const mode = "in oklch";
		let color1: CSSValueNode = { type: "keyword", value: "red" };
		let color2: CSSValueNode = { type: "keyword", value: "blue" };
		let weight1: number | undefined;
		let weight2: number | undefined;

		if (args.length >= 1) color1 = args[0]!;
		if (args.length >= 2) color2 = args[1]!;
		if (args.length >= 3 && args[2]!.type === "percentage") {
			weight1 = (args[2] as PercentageNode).number;
			weight2 = 100 - weight1;
		}

		return { type: "color-mix", mode: mode as "in" | "in oklch" | "in srgb", color1, color2, weight1, weight2 };
	}

	private parseLightDark(args: CSSValueNode[]): LightDarkNode {
		const light = args[0] ?? { type: "keyword", value: "white" };
		const dark = args[1] ?? { type: "keyword", value: "black" };

		return { type: "light-dark", light, dark };
	}

	private parseFunction(): FunctionNode | ColorFunctionNode | ColorMixNode | LightDarkNode {
		const token = this.consume();
		return this.parseFunctionWithName(token.value);
	}
}

export function parseValue(source: string, options?: CSSValueOptions): CSSValueNode {
	const parser = new CSSValueParser(options);
	return parser.parse(source);
}
