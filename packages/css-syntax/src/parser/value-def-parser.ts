import type { TokenValue } from "../lexer/token.js";
import type {
	SyntaxNode,
	SyntaxTree,
	ParserOptions,
	Multiplier,
	TypeReference,
	PropertyReference,
	Range,
	FunctionNode,
	Group,
	MultipliedNode,
	CombinedNode,
} from "./ast.js";

import { Token, LexContext } from "../lexer/index.js";
import { ParseError } from "./ast.js";
import { CombinatorType, MultiplierType } from "./ast.js";

export class Parser {
	private tokens: TokenValue[] = [];
	private pos = 0;
	private options: ParserOptions;

	constructor(options: ParserOptions = {}) {
		this.options = options;
	}

	parse(source: string): SyntaxTree {
		const { Lexer } = require("../lexer/index.js");
		const lexer = new Lexer(source);

		this.tokens = [];
		let token: TokenValue;
		while ((token = lexer.next(LexContext.ValueDef)).token !== Token.EOF) {
			if (token.token !== Token.Whitespace && token.token !== Token.Comment) {
				this.tokens.push(token);
			}
		}
		this.pos = 0;

		const root = this.parseSyntax();

		if (this.peek().token !== Token.EOF) {
			this.error("Unexpected input", this.peek());
		}

		return { root };
	}

	private peek(): TokenValue {
		return (
			this.tokens[this.pos] ?? {
				token: Token.EOF,
				value: "",
				pos: this.tokens[this.tokens.length - 1]?.end ?? 0,
				end: this.tokens[this.tokens.length - 1]?.end ?? 0,
			}
		);
	}

	private consume(): TokenValue {
		return (
			this.tokens[this.pos++] ?? {
				token: Token.EOF,
				value: "",
				pos: 0,
				end: 0,
			}
		);
	}

	private expect(token: Token, expected?: string[]): TokenValue {
		const current = this.peek();
		if (current.token !== token) {
			const tokenName = Object.entries(Token).find(([, v]) => v === token)?.[0] ?? String(token);
			this.error(`Expected ${tokenName}`, current, expected ?? [tokenName]);
		}
		return this.consume();
	}

	private error(message: string, token: TokenValue, expected?: string[]): never {
		const error = new ParseError(message, token, expected);
		this.options.onError?.(error);
		throw error;
	}

	private parseSyntax(): SyntaxNode {
		return this.parseExpression(0);
	}

	private canStartTerm(): boolean {
		const token = this.peek();
		return (
			token.token === Token.Ident ||
			token.token === Token.LeftParen ||
			token.token === Token.LeftBracket ||
			(token.token === Token.Delim && token.value === "<") ||
			token.token === Token.LeftBrace
		);
	}

	private parseExpression(minPrecedence: number): SyntaxNode {
		let left = this.parseTerm();

		while (true) {
			const combinator = this.parseCombinator();
			if (combinator) {
				const precedence = this.getCombinatorPrecedence(combinator);
				if (precedence < minPrecedence) break;

				const right = this.parseExpression(precedence + 1);
				left = this.createCombinedNode(left, combinator, right);
				continue;
			}

			if (this.canStartTerm()) {
				const precedence = this.getCombinatorPrecedence(CombinatorType.Juxtapose);
				if (precedence < minPrecedence) break;

				const right = this.parseExpression(precedence + 1);
				left = this.createCombinedNode(left, CombinatorType.Juxtapose, right);
				continue;
			}

			break;
		}

		return left;
	}

	private parseTerm(): SyntaxNode {
		const token = this.peek();

		if (token.token === Token.LeftBracket) {
			return this.parseGroup();
		}

		if (token.token === Token.LeftBrace) {
			return this.parseMultiplierExpression();
		}

		let node = this.parsePrimary();

		if (this.peek().token === Token.LeftBrace) {
			const multiplier = this.parseMultiplier();
			return this.createMultipliedNode(node, multiplier);
		}

		if (this.peek().token === Token.QuestionMark) {
			this.consume();
			return this.createMultipliedNode(node, { type: MultiplierType.Question });
		}

		if (this.peek().token === Token.Asterisk) {
			this.consume();
			return this.createMultipliedNode(node, { type: MultiplierType.Star });
		}

		if (this.peek().token === Token.Plus) {
			this.consume();
			return this.createMultipliedNode(node, { type: MultiplierType.Plus });
		}

		if (this.peek().token === Token.HashMark) {
			this.consume();
			return this.createMultipliedNode(node, { type: MultiplierType.Hash });
		}

		return node;
	}

	private parsePrimary(): SyntaxNode {
		const token = this.peek();

		if (token.token === Token.Ident) {
			this.consume();

			if (this.peek().token === Token.LeftParen) {
				return this.parseFunction(token.value);
			}

			return { type: "keyword", value: token.value };
		}

		if (token.token === Token.Function) {
			this.consume();
			return this.parseFunction(token.value);
		}

		if (token.token === Token.LeftBracket) {
			return this.parseGroup();
		}

		if (token.token === Token.LeftParen) {
			this.consume();
			const node = this.parseSyntax();
			this.expect(Token.RightParen);
			return node;
		}

		if (token.token === Token.Delim && token.value === "<") {
			return this.parseTypeOrRange();
		}

		this.error("Unexpected token", token);
	}

	private parseTypeOrRange(): TypeReference | Range | PropertyReference {
		const openDelim = this.peek();
		if (openDelim.token !== Token.Delim || openDelim.value !== "<") {
			this.error("Expected '<'", openDelim);
		}
		this.consume();

		const token = this.peek();
		if (token.token !== Token.Ident && token.token !== Token.Delim) {
			this.error("Expected identifier or '<' for property reference", token);
		}

		if (token.token === Token.Delim && token.value === "'") {
			return this.parsePropertyReference();
		}

		const ident = this.expect(Token.Ident);
		const name = ident.value;

		if (this.peek().token === Token.LeftBracket) {
			return this.parseRange(name);
		}

		const closeDelim = this.peek();
		if (closeDelim.token !== Token.Delim || closeDelim.value !== ">") {
			this.error("Expected '>'", closeDelim);
		}
		this.consume();

		return { type: "type-reference", name };
	}

	private parsePropertyReference(): PropertyReference {
		const firstQuote = this.peek();
		if (firstQuote.token !== Token.Delim || firstQuote.value !== "'") {
			this.error('Expected "\'"', firstQuote);
		}
		this.consume();

		const token = this.expect(Token.Ident);
		const property = token.value;

		const secondQuote = this.peek();
		if (secondQuote.token !== Token.Delim || secondQuote.value !== "'") {
			this.error('Expected "\'"', secondQuote);
		}
		this.consume();

		const closeAngle = this.peek();
		if (closeAngle.token !== Token.Delim || closeAngle.value !== ">") {
			this.error("Expected '>'", closeAngle);
		}
		this.consume();

		return { type: "property-reference", property };
	}

	private parseRange(base: string): Range {
		this.expect(Token.LeftBracket);

		const minToken = this.expect(Token.Number);
		const min = Number.parseFloat(minToken.value);

		this.expect(Token.Comma);

		const maxToken = this.expect(Token.Number);
		const max = Number.parseFloat(maxToken.value);

		this.expect(Token.RightBracket);

		const closeAngle = this.peek();
		if (closeAngle.token !== Token.Delim || closeAngle.value !== ">") {
			this.error("Expected '>'", closeAngle);
		}
		this.consume();

		return { type: "range", base, min, max };
	}

	private parseFunction(name: string): FunctionNode {
		const args: SyntaxNode[] = [];
		while (this.peek().token !== Token.RightParen && this.peek().token !== Token.EOF) {
			args.push(this.parseSyntax());
			if (this.peek().token === Token.Comma) {
				this.consume();
			}
		}

		if (this.peek().token === Token.RightParen) {
			this.consume();
		}

		return { type: "function", name, args };
	}

	private parseGroup(): Group {
		this.expect(Token.LeftBracket);

		const nodes: SyntaxNode[] = [];

		if (this.peek().token !== Token.RightBracket) {
			nodes.push(this.parseSyntax());

			while (this.peek().token !== Token.RightBracket) {
				nodes.push(this.parseSyntax());
			}
		}

		this.expect(Token.RightBracket);

		let required = false;
		if (this.peek().token === Token.ExclamationMark) {
			this.consume();
			required = true;
		}

		let combinator: CombinatorType | undefined;
		if (this.peek().token === Token.Bar) {
			this.consume();
			combinator = CombinatorType.Bar;
		} else if (this.peek().token === Token.DoubleBar) {
			this.consume();
			combinator = CombinatorType.DoubleBar;
		} else if (this.peek().token === Token.DoubleAmp) {
			this.consume();
			combinator = CombinatorType.DoubleAmpersand;
		}

		const group: Group = { type: "group", nodes, required, combinator };

		if (this.peek().token === Token.LeftBrace) {
			const multiplier = this.parseMultiplier();
			return { ...group, multiplier };
		}

		if (this.peek().token === Token.QuestionMark) {
			this.consume();
			return { ...group, multiplier: { type: MultiplierType.Question } };
		}

		if (this.peek().token === Token.Asterisk) {
			this.consume();
			return { ...group, multiplier: { type: MultiplierType.Star } };
		}

		if (this.peek().token === Token.Plus) {
			this.consume();
			return { ...group, multiplier: { type: MultiplierType.Plus } };
		}

		if (this.peek().token === Token.HashMark) {
			this.consume();
			return { ...group, multiplier: { type: MultiplierType.Hash } };
		}

		return group;
	}

	private parseCombinator(): CombinatorType | null {
		const token = this.peek();

		if (token.token === Token.Bar) {
			this.consume();
			return CombinatorType.Bar;
		}

		if (token.token === Token.DoubleBar) {
			this.consume();
			return CombinatorType.DoubleBar;
		}

		if (token.token === Token.DoubleAmp) {
			this.consume();
			return CombinatorType.DoubleAmpersand;
		}

		return null;
	}

	private parseMultiplier(): Multiplier {
		this.expect(Token.LeftBrace);

		const firstToken = this.expect(Token.Number);
		const first = Number.parseInt(firstToken.value, 10);

		if (this.peek().token === Token.RightBrace) {
			this.expect(Token.RightBrace);
			return { type: MultiplierType.Exact, min: first };
		}

		if (this.peek().token === Token.Comma) {
			this.consume();

			if (this.peek().token === Token.RightBrace) {
				this.expect(Token.RightBrace);
				return { type: MultiplierType.Min, min: first };
			}

			const secondToken = this.expect(Token.Number);
			const second = Number.parseInt(secondToken.value, 10);

			this.expect(Token.RightBrace);
			return { type: MultiplierType.Range, min: first, max: second };
		}

		this.error("Expected '}' or ','", this.peek());
	}

	private parseMultiplierExpression(): SyntaxNode {
		this.consume();
		const multiplier = this.parseMultiplier();
		const node = this.parseTerm();
		return this.createMultipliedNode(node, multiplier);
	}

	private getCombinatorPrecedence(combinator: CombinatorType): number {
		switch (combinator) {
			case CombinatorType.DoubleAmpersand:
				return 3;
			case CombinatorType.DoubleBar:
				return 2;
			case CombinatorType.Bar:
				return 1;
			case CombinatorType.Juxtapose:
				return 0;
		}
	}

	private createCombinedNode(left: SyntaxNode, combinator: CombinatorType, right: SyntaxNode): CombinedNode {
		return { type: "combined", left, combinator, right };
	}

	private createMultipliedNode(node: SyntaxNode, multiplier: Multiplier): MultipliedNode {
		return { type: "multiplied", node, multiplier };
	}
}

export function parse(source: string, options?: ParserOptions): SyntaxTree {
	const parser = new Parser(options);
	return parser.parse(source);
}
