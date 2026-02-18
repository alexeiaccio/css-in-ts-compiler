/**
 * CSS Value Definition Syntax Parser
 *
 * Parses MDN CSS value definition syntax into an AST.
 * Based on: https://drafts.csswg.org/css-values-3/#value-defs
 *
 * Syntax examples:
 * - <length>              -> { type: "type", name: "length" }
 * - <length> | <percentage> -> { type: "or", items: [...] }
 * - <length>{2,4}         -> { type: "repeat", min: 2, max: 4, item: ... }
 * - [ <length> | auto ]!  -> { type: "required", item: ... }
 */

export interface SyntaxNode {
	type: string;
	[key: string]: unknown;
}

export interface TypeNode extends SyntaxNode {
	type: "type";
	name: string;
}

export interface KeywordNode extends SyntaxNode {
	type: "keyword";
	value: string;
}

export interface OrNode extends SyntaxNode {
	type: "or";
	items: SyntaxNode[];
}

export interface AndNode extends SyntaxNode {
	type: "and";
	items: SyntaxNode[];
}

export interface JuxtapositionNode extends SyntaxNode {
	type: "juxtaposition";
	items: SyntaxNode[];
}

export interface GroupNode extends SyntaxNode {
	type: "group";
	item: SyntaxNode;
}

export interface OptionalNode extends SyntaxNode {
	type: "optional";
	item: SyntaxNode;
}

export interface RepeatNode extends SyntaxNode {
	type: "repeat";
	min: number;
	max: number | null;
	item: SyntaxNode;
}

export interface RequiredNode extends SyntaxNode {
	type: "required";
	item: SyntaxNode;
}

export interface SeparatorNode extends SyntaxNode {
	type: "separator";
	value: string;
}

export interface FunctionNode extends SyntaxNode {
	type: "function";
	name: string;
	args: SyntaxNode;
}

type Token = {
	type: "type" | "keyword" | "combinator" | "multiplier" | "bracket" | "paren" | "separator";
	value: string;
};

function tokenize(syntax: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;

	while (i < syntax.length) {
		const char = syntax[i]!;

		// Skip whitespace
		if (/\s/.test(char)) {
			i++;
			continue;
		}

		// Type reference: <length>
		if (char === "<") {
			const end = syntax.indexOf(">", i);
			if (end === -1) {
				throw new Error(`Unclosed type reference at position ${i}`);
			}
			tokens.push({ type: "type", value: syntax.slice(i + 1, end) });
			i = end + 1;
			continue;
		}

		// Brackets: [ ]
		if (char === "[" || char === "]") {
			tokens.push({ type: "bracket", value: char });
			i++;
			continue;
		}

		// Parentheses: ( )
		if (char === "(" || char === ")") {
			tokens.push({ type: "paren", value: char });
			i++;
			continue;
		}

		// Separators: , / : ;
		if (char === "," || char === "/" || char === ":" || char === ";") {
			tokens.push({ type: "separator", value: char });
			i++;
			continue;
		}

		// Combinators: | || &&
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

		// Multipliers: ? * + # {n,m}
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
				throw new Error(`Unclosed multiplier at position ${i}`);
			}
			tokens.push({ type: "multiplier", value: syntax.slice(i, end + 1) });
			i = end + 1;
			continue;
		}

		// Required: !
		if (char === "!") {
			tokens.push({ type: "multiplier", value: "!" });
			i++;
			continue;
		}

		// Single/double quoted keywords
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

		// Bare keyword (alphanumeric, hyphens)
		if (/[a-zA-Z-]/.test(char)) {
			let end = i;
			while (end < syntax.length && syntax[end] && /[a-zA-Z0-9-]/.test(syntax[end]!)) {
				end++;
			}
			tokens.push({ type: "keyword", value: syntax.slice(i, end) });
			i = end;
			continue;
		}

		throw new Error(`Unexpected character '${char}' at position ${i} in syntax: ${syntax}`);
	}

	return tokens;
}

function parseMultiplier(mult: string): { min: number; max: number | null } | "required" | "optional" {
	if (mult === "?") return "optional";
	if (mult === "*") return { min: 0, max: null };
	if (mult === "+") return { min: 1, max: null };
	if (mult === "#") return { min: 1, max: null }; // comma-separated list
	if (mult === "!") return "required";
	if (mult.startsWith("{")) {
		const match = mult.match(/\{(\d+)(?:,(\d*))?\}/);
		if (match && match[1]) {
			const min = parseInt(match[1], 10);
			const max = match[2] ? parseInt(match[2], 10) : min;
			return { min, max };
		}
	}
	return { min: 0, max: null };
}

function findMatchingBracket(tokens: Token[], start: number, open: string, close: string): number {
	let depth = 1;
	let j = start + 1;
	while (j < tokens.length && depth > 0) {
		const t = tokens[j];
		if (t) {
			if (t.type === "bracket" || t.type === "paren") {
				if (t.value === open) depth++;
				else if (t.value === close) depth--;
			}
		}
		j++;
	}
	return j - 1;
}

function parseTokens(tokens: Token[]): SyntaxNode[] {
	const nodes: SyntaxNode[] = [];
	let i = 0;

	while (i < tokens.length) {
		const token = tokens[i]!;

		if (token.type === "type") {
			nodes.push({ type: "type", name: token.value });
			i++;
		} else if (token.type === "keyword") {
			nodes.push({ type: "keyword", value: token.value });
			i++;
		} else if (token.type === "separator") {
			nodes.push({ type: "separator", value: token.value });
			i++;
		} else if (token.type === "bracket" && token.value === "[") {
			const j = findMatchingBracket(tokens, i, "[", "]");
			const innerTokens = tokens.slice(i + 1, j);
			const innerNodes = parseTokens(innerTokens);

			let item: SyntaxNode;
			if (innerNodes.length === 1 && innerNodes[0]) {
				item = innerNodes[0];
			} else {
				item = { type: "juxtaposition", items: innerNodes };
			}

			const nextToken = tokens[j + 1];
			if (nextToken && nextToken.type === "multiplier") {
				const mult = parseMultiplier(nextToken.value);
				if (mult === "required") {
					nodes.push({ type: "required", item });
				} else if (mult === "optional") {
					nodes.push({ type: "optional", item });
				} else if (typeof mult === "object") {
					nodes.push({ type: "repeat", min: mult.min, max: mult.max, item });
				}
				i = j + 2;
			} else {
				nodes.push({ type: "group", item });
				i = j + 1;
			}
		} else if (token.type === "paren" && token.value === "(") {
			const j = findMatchingBracket(tokens, i, "(", ")");
			const innerTokens = tokens.slice(i + 1, j);
			const innerNodes = parseTokens(innerTokens);

			let item: SyntaxNode;
			if (innerNodes.length === 1 && innerNodes[0]) {
				item = innerNodes[0];
			} else {
				item = { type: "juxtaposition", items: innerNodes };
			}

			nodes.push({ type: "group", item });
			i = j + 1;
		} else {
			i++;
		}
	}

	return nodes;
}

function combineWithCombinators(nodes: SyntaxNode[], tokens: Token[]): SyntaxNode {
	if (nodes.length === 0) {
		return { type: "keyword", value: "" };
	}
	const firstNode = nodes[0];
	if (nodes.length === 1 && firstNode) {
		return firstNode;
	}

	// Find combinators and group
	// Priority: || (lowest) > && > | > juxtaposition (implicit, highest)

	// Check for ||
	let i = 0;
	while (i < tokens.length) {
		const t = tokens[i];
		if (t && t.type === "combinator" && t.value === "||") {
			// Split at ||
			const leftNodes = nodes.slice(0, Math.floor(nodes.length / 2));
			const rightNodes = nodes.slice(Math.floor(nodes.length / 2));
			return {
				type: "or",
				items: [combineWithCombinators(leftNodes, tokens.slice(0, i)), combineWithCombinators(rightNodes, tokens.slice(i + 1))],
			};
		}
		i++;
	}

	// Check for &&
	i = 0;
	while (i < tokens.length) {
		const t = tokens[i];
		if (t && t.type === "combinator" && t.value === "&&") {
			const leftNodes = nodes.slice(0, Math.floor(nodes.length / 2));
			const rightNodes = nodes.slice(Math.floor(nodes.length / 2));
			return {
				type: "and",
				items: [combineWithCombinators(leftNodes, tokens.slice(0, i)), combineWithCombinators(rightNodes, tokens.slice(i + 1))],
			};
		}
		i++;
	}

	// Check for |
	i = 0;
	while (i < tokens.length) {
		const t = tokens[i];
		if (t && t.type === "combinator" && t.value === "|") {
			const leftNodes = nodes.slice(0, Math.floor(nodes.length / 2));
			const rightNodes = nodes.slice(Math.floor(nodes.length / 2));
			return {
				type: "or",
				items: [combineWithCombinators(leftNodes, tokens.slice(0, i)), combineWithCombinators(rightNodes, tokens.slice(i + 1))],
			};
		}
		i++;
	}

	// Default: juxtaposition (implicit space-separated)
	return { type: "juxtaposition", items: nodes };
}

export function parseSyntax(syntax: string): SyntaxNode {
	const tokens = tokenize(syntax);
	const nodes = parseTokens(tokens);

	// Apply multipliers to preceding items
	for (let i = tokens.length - 1; i >= 0; i--) {
		const token = tokens[i];
		if (token && token.type === "multiplier") {
			const mult = parseMultiplier(token.value);
			const nodeIndex = Math.min(i, nodes.length - 1);
			const prevNode = nodes[nodeIndex];

			if (prevNode) {
				if (mult === "required") {
					nodes[nodeIndex] = { type: "required", item: prevNode };
				} else if (mult === "optional" || (typeof mult === "object" && mult.max === 1)) {
					nodes[nodeIndex] = { type: "optional", item: prevNode };
				} else if (typeof mult === "object") {
					nodes[nodeIndex] = { type: "repeat", min: mult.min, max: mult.max, item: prevNode };
				}
			}
		}
	}

	return combineWithCombinators(nodes, tokens);
}

export function isTypeNode(node: SyntaxNode): node is TypeNode {
	return node.type === "type";
}

export function isKeywordNode(node: SyntaxNode): node is KeywordNode {
	return node.type === "keyword";
}

export function isOrNode(node: SyntaxNode): node is OrNode {
	return node.type === "or";
}

export function isAndNode(node: SyntaxNode): node is AndNode {
	return node.type === "and";
}

export function isOptionalNode(node: SyntaxNode): node is OptionalNode {
	return node.type === "optional";
}

export function isRepeatNode(node: SyntaxNode): node is RepeatNode {
	return node.type === "repeat";
}
