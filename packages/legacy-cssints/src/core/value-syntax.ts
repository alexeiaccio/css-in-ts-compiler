/**
 * CSS Value Definition Syntax Parser
 *
 * Parses MDN CSS value definition syntax into an AST.
 * Based on: https://drafts.csswg.org/css-values-3/#value-defs
 */

import { Data, Effect, Schema } from "effect";

type SyntaxNode =
	| TypeNode
	| KeywordNode
	| OrNode
	| AndNode
	| JuxtapositionNode
	| GroupNode
	| OptionalNode
	| RepeatNode
	| RequiredNode
	| SeparatorNode
	| FunctionNode;

class TypeNode extends Data.TaggedClass("Type")<{ readonly name: string }> {}
class KeywordNode extends Data.TaggedClass("Keyword")<{ readonly value: string }> {}
class OrNode extends Data.TaggedClass("Or")<{ readonly items: readonly SyntaxNode[] }> {}
class AndNode extends Data.TaggedClass("And")<{ readonly items: readonly SyntaxNode[] }> {}
class JuxtapositionNode extends Data.TaggedClass("Juxtaposition")<{ readonly items: readonly SyntaxNode[] }> {}
class GroupNode extends Data.TaggedClass("Group")<{ readonly item: SyntaxNode }> {}
class OptionalNode extends Data.TaggedClass("Optional")<{ readonly item: SyntaxNode }> {}
class RepeatNode extends Data.TaggedClass("Repeat")<{
	readonly min: number;
	readonly max: number | null;
	readonly item: SyntaxNode;
}> {}
class RequiredNode extends Data.TaggedClass("Required")<{ readonly item: SyntaxNode }> {}
class SeparatorNode extends Data.TaggedClass("Separator")<{ readonly value: string }> {}
class FunctionNode extends Data.TaggedClass("Function")<{ readonly name: string; readonly args: SyntaxNode }> {}

export {
	type SyntaxNode,
	TypeNode,
	KeywordNode,
	OrNode,
	AndNode,
	JuxtapositionNode,
	GroupNode,
	OptionalNode,
	RepeatNode,
	RequiredNode,
	SeparatorNode,
	FunctionNode,
};

type Token = {
	type: "type" | "keyword" | "combinator" | "multiplier" | "bracket" | "paren" | "separator" | "function";
	value: string;
	name?: string;
};

class ParseError extends Data.TaggedError("ParseError")<{
	readonly message: string;
	readonly position: number;
}> {}

const tokenize = (syntax: string): Effect.Effect<Token[], ParseError> =>
	Effect.gen(function* () {
		const tokens: Token[] = [];
		let i = 0;

		while (i < syntax.length) {
			const char = syntax[i]!;

			if (/\s/.test(char)) {
				i++;
				continue;
			}

			if (char === "<") {
				const end = syntax.indexOf(">", i);
				if (end === -1) {
					yield* new ParseError({ message: `Unclosed type reference at position ${i}`, position: i });
				}
				tokens.push({ type: "type", value: syntax.slice(i + 1, end) });
				i = end + 1;
				continue;
			}

			if (char === "[" || char === "]") {
				tokens.push({ type: "bracket", value: char });
				i++;
				continue;
			}

			if (char === "(" || char === ")") {
				tokens.push({ type: "paren", value: char });
				i++;
				continue;
			}

			if (char === "," || char === "/" || char === ":" || char === ";") {
				tokens.push({ type: "separator", value: char });
				i++;
				continue;
			}

			if (char === "|") {
				if (syntax[i + 1] === "|") {
					tokens.push({ type: "combinator", value: "||" });
					i += 2;
				} else {
					tokens.push({ type: "combinator", value: "|" });
					i++;
				}
				continue;
			}

			if (char === "&" && syntax[i + 1] === "&") {
				tokens.push({ type: "combinator", value: "&&" });
				i += 2;
				continue;
			}

			if (char === "?" || char === "*" || char === "+") {
				tokens.push({ type: "multiplier", value: char });
				i++;
				continue;
			}

			if (char === "#") {
				tokens.push({ type: "multiplier", value: "#" });
				i++;
				continue;
			}

			if (char === "{") {
				const end = syntax.indexOf("}", i);
				if (end === -1) {
					yield* new ParseError({ message: `Unclosed multiplier at position ${i}`, position: i });
				}
				tokens.push({ type: "multiplier", value: syntax.slice(i, end + 1) });
				i = end + 1;
				continue;
			}

			if (char === "!") {
				tokens.push({ type: "multiplier", value: "!" });
				i++;
				continue;
			}

			if (char === "'" || char === '"') {
				const quote = char;
				let end = i + 1;
				while (end < syntax.length && syntax[end] && syntax[end] !== quote) {
					if (syntax[end] === "\\") end++;
					end++;
				}
				tokens.push({ type: "keyword", value: syntax.slice(i + 1, end) });
				i = end + 1;
				continue;
			}

			if (/[a-zA-Z]/.test(char)) {
				let end = i;
				while (end < syntax.length && syntax[end] && /[a-zA-Z0-9.%]/.test(syntax[end]!)) {
					end++;
				}
				const value = syntax.slice(i, end);
				if (syntax[end] === "(") {
					tokens.push({ type: "function", value: "(", name: value });
					i = end + 1;
				} else {
					tokens.push({ type: "keyword", value });
					i = end;
				}
				continue;
			}

			if (/[0-9]/.test(char)) {
				let end = i;
				while (end < syntax.length && syntax[end] && /[0-9.%]/.test(syntax[end]!)) {
					end++;
				}
				tokens.push({ type: "keyword", value: syntax.slice(i, end) });
				i = end;
				continue;
			}

			if (char === "%") {
				tokens.push({ type: "keyword", value: "%" });
				i++;
				continue;
			}

			if (char === "∞") {
				tokens.push({ type: "keyword", value: "∞" });
				i++;
				continue;
			}

			if (char === "-") {
				tokens.push({ type: "separator", value: "-" });
				i++;
				continue;
			}

			if (char === "+") {
				tokens.push({ type: "separator", value: "+" });
				i++;
				continue;
			}

			if (char === "†") {
				tokens.push({ type: "keyword", value: "†" });
				i++;
				continue;
			}

			if (char === "@") {
				tokens.push({ type: "keyword", value: "@" });
				i++;
				continue;
			}

			yield* new ParseError({ message: `Unexpected character '${char}'`, position: i });
		}

		return tokens;
	});

const parseMultiplier = (mult: string): { min: number; max: number | null } | "required" | "optional" => {
	if (mult === "?") return "optional";
	if (mult === "*") return { min: 0, max: null };
	if (mult === "+") return { min: 1, max: null };
	if (mult === "#") return { min: 1, max: null };
	if (mult === "!") return "required";
	if (mult.startsWith("{")) {
		const match = mult.match(/\{(\d+)(?:,(∞|\d*))?\}/);
		if (match && match[1]) {
			const min = parseInt(match[1], 10);
			const max = match[2] === "∞" ? null : match[2] ? parseInt(match[2], 10) : min;
			return { min, max };
		}
	}
	return { min: 0, max: null };
};

const findMatchingBracket = (tokens: Token[], start: number, open: string, close: string): number => {
	let depth = 1;
	let j = start + 1;
	while (j < tokens.length && depth > 0) {
		const t = tokens[j];
		if (t) {
			if (t.type === "bracket" || t.type === "paren" || t.type === "function") {
				if (t.value === open) depth++;
				else if (t.value === close) depth--;
			}
		}
		j++;
	}
	return j - 1;
};

const parseTokens = (tokens: Token[]): Effect.Effect<SyntaxNode[], ParseError> =>
	Effect.gen(function* () {
		const nodes: SyntaxNode[] = [];
		let i = 0;

		while (i < tokens.length) {
			const token = tokens[i]!;

			if (token.type === "type") {
				nodes.push(new TypeNode({ name: token.value }));
				i++;
			} else if (token.type === "keyword") {
				nodes.push(new KeywordNode({ value: token.value }));
				i++;
			} else if (token.type === "separator") {
				nodes.push(new SeparatorNode({ value: token.value }));
				i++;
			} else if (token.type === "bracket" && token.value === "[") {
				const j = findMatchingBracket(tokens, i, "[", "]");
				const innerTokens = tokens.slice(i + 1, j);
				const innerNodes = yield* parseTokens(innerTokens);

				let item: SyntaxNode;
				if (innerNodes.length === 1 && innerNodes[0]) {
					item = innerNodes[0];
				} else {
					item = new JuxtapositionNode({ items: innerNodes });
				}

				const nextToken = tokens[j + 1];
				if (nextToken && nextToken.type === "multiplier") {
					const mult = parseMultiplier(nextToken.value);
					if (mult === "required") {
						nodes.push(new RequiredNode({ item }));
					} else if (mult === "optional") {
						nodes.push(new OptionalNode({ item }));
					} else if (typeof mult === "object") {
						nodes.push(new RepeatNode({ min: mult.min, max: mult.max, item }));
					}
					i = j + 2;
				} else {
					nodes.push(new GroupNode({ item }));
					i = j + 1;
				}
			} else if (token.type === "paren" && token.value === "(") {
				const j = findMatchingBracket(tokens, i, "(", ")");
				const innerTokens = tokens.slice(i + 1, j);
				const innerNodes = yield* parseTokens(innerTokens);

				let item: SyntaxNode;
				if (innerNodes.length === 1 && innerNodes[0]) {
					item = innerNodes[0];
				} else {
					item = new JuxtapositionNode({ items: innerNodes });
				}

				nodes.push(new GroupNode({ item }));
				i = j + 1;
			} else if (token.type === "function") {
				const j = findMatchingBracket(tokens, i, "(", ")");
				const innerTokens = tokens.slice(i + 1, j);
				const innerNodes = yield* parseTokens(innerTokens);

				let args: SyntaxNode;
				if (innerNodes.length === 1 && innerNodes[0]) {
					args = innerNodes[0];
				} else {
					args = new JuxtapositionNode({ items: innerNodes });
				}

				nodes.push(new FunctionNode({ name: token.name!, args }));
				i = j + 1;
			} else {
				i++;
			}
		}

		return nodes;
	});

const combineWithCombinators = (nodes: SyntaxNode[], tokens: Token[]): Effect.Effect<SyntaxNode, ParseError> =>
	Effect.gen(function* () {
		if (nodes.length === 0) {
			return new KeywordNode({ value: "" });
		}
		const firstNode = nodes[0];
		if (nodes.length === 1 && firstNode) {
			return firstNode;
		}

		let i = 0;
		while (i < tokens.length) {
			const t = tokens[i];
			if (t && t.type === "combinator" && t.value === "||") {
				const leftNodes = nodes.slice(0, Math.floor(nodes.length / 2));
				const rightNodes = nodes.slice(Math.floor(nodes.length / 2));
				const left = yield* combineWithCombinators(leftNodes, tokens.slice(0, i));
				const right = yield* combineWithCombinators(rightNodes, tokens.slice(i + 1));
				return new OrNode({ items: [left, right] });
			}
			i++;
		}

		i = 0;
		while (i < tokens.length) {
			const t = tokens[i];
			if (t && t.type === "combinator" && t.value === "&&") {
				const leftNodes = nodes.slice(0, Math.floor(nodes.length / 2));
				const rightNodes = nodes.slice(Math.floor(nodes.length / 2));
				const left = yield* combineWithCombinators(leftNodes, tokens.slice(0, i));
				const right = yield* combineWithCombinators(rightNodes, tokens.slice(i + 1));
				return new AndNode({ items: [left, right] });
			}
			i++;
		}

		i = 0;
		while (i < tokens.length) {
			const t = tokens[i];
			if (t && t.type === "combinator" && t.value === "|") {
				const leftNodes = nodes.slice(0, Math.floor(nodes.length / 2));
				const rightNodes = nodes.slice(Math.floor(nodes.length / 2));
				const left = yield* combineWithCombinators(leftNodes, tokens.slice(0, i));
				const right = yield* combineWithCombinators(rightNodes, tokens.slice(i + 1));
				return new OrNode({ items: [left, right] });
			}
			i++;
		}

		return new JuxtapositionNode({ items: nodes });
	});

export const parseSyntax = (syntax: string): Effect.Effect<SyntaxNode, ParseError> =>
	Effect.gen(function* () {
		const tokens = yield* tokenize(syntax);
		const nodes = yield* parseTokens(tokens);

		for (let i = tokens.length - 1; i >= 0; i--) {
			const token = tokens[i];
			if (token && token.type === "multiplier") {
				const mult = parseMultiplier(token.value);
				const nodeIndex = Math.min(i, nodes.length - 1);
				const prevNode = nodes[nodeIndex];

				if (prevNode) {
					if (mult === "required") {
						nodes[nodeIndex] = new RequiredNode({ item: prevNode });
					} else if (mult === "optional" || (typeof mult === "object" && mult.max === 1)) {
						nodes[nodeIndex] = new OptionalNode({ item: prevNode });
					} else if (typeof mult === "object") {
						nodes[nodeIndex] = new RepeatNode({ min: mult.min, max: mult.max, item: prevNode });
					}
				}
			}
		}

		return yield* combineWithCombinators(nodes, tokens);
	});

export const parseSyntaxSync = (syntax: string): SyntaxNode => {
	return Effect.runSync(parseSyntax(syntax));
};

const cssTypeToSchema = (typeName: string): Schema.Schema<unknown> => {
	const baseType = typeName.replace(/\s*\[.*\]/, "").trim();

	switch (baseType) {
		case "number":
		case "length":
		case "percentage":
		case "angle":
		case "frequency":
		case "resolution":
			return Schema.Number;
		case "time":
			return Schema.Number;
		case "integer":
			return Schema.Number;
		case "string":
		case "color":
		case "url":
		case "ident":
		case "custom-ident":
		case "dashed-ident":
			return Schema.String;
		default:
			return Schema.Unknown;
	}
};

const keywordToSchema = (value: string): Schema.Schema<unknown> => {
	if (/^\d+$/.test(value)) {
		return Schema.Number;
	}
	return Schema.String;
};

export const syntaxToSchema = (node: SyntaxNode): Schema.Schema<unknown> => {
	switch (node._tag) {
		case "Type":
			return cssTypeToSchema(node.name);
		case "Keyword":
			return keywordToSchema(node.value);
		case "Or":
			return Schema.Union([syntaxToSchema(node.items[0]!), syntaxToSchema(node.items[1]!)]);
		case "And":
			return Schema.Struct(Object.fromEntries(node.items.map((item, idx) => [`_${idx}`, syntaxToSchema(item)])));
		case "Juxtaposition":
			if (node.items.length === 1) {
				return syntaxToSchema(node.items[0]!);
			}
			return Schema.Tuple([syntaxToSchema(node.items[0]!), syntaxToSchema(node.items[1]!)]);
		case "Group":
			return syntaxToSchema(node.item);
		case "Optional":
			return Schema.optional(syntaxToSchema(node.item));
		case "Repeat":
			return Schema.Array(syntaxToSchema(node.item));
		case "Required":
			return syntaxToSchema(node.item);
		case "Separator":
			return Schema.String;
		case "Function":
			return Schema.String;
		default:
			return Schema.Unknown;
	}
};

export const isTypeNode = (node: SyntaxNode): node is TypeNode => node._tag === "Type";
export const isKeywordNode = (node: SyntaxNode): node is KeywordNode => node._tag === "Keyword";
export const isOrNode = (node: SyntaxNode): node is OrNode => node._tag === "Or";
export const isAndNode = (node: SyntaxNode): node is AndNode => node._tag === "And";
export const isOptionalNode = (node: SyntaxNode): node is OptionalNode => node._tag === "Optional";
export const isRepeatNode = (node: SyntaxNode): node is RepeatNode => node._tag === "Repeat";
