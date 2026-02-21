/**
 * CSS Syntax Parser
 *
 * Parses CSS value syntax definitions (like "<length> | <percentage>") into AST nodes.
 * 
 * CSS Syntax Grammar (simplified):
 *   expr     := term (combinator term)*
 *   combinator := '|' | '||' | '&&' | ' '
 *   term     := primitive | reference | group | optional | repeat
 *   primitive := "number" | "string" | "ident" | "url" | ...
 *   reference := '<' name '>'
 *   group    := '[' expr ']'
 *   optional := term '?'
 *   repeat   := term ('*' | '+' | '{n,m}')
 */

import type {
	CSSValueType,
	PrimitiveType,
	CompositeType,
	EnumType,
	AliasType,
	TypeReference,
} from "./css-type-ast";
import {
	createPrimitiveType,
	createCompositeType,
	createEnumType,
	createTypeRef,
	KNOWN_PRIMITIVES,
} from "./css-type-ast";

// ============================================================================
// Token Types
// ============================================================================

type TokenType = 
	| "ANGLE_BRACKET_OPEN"   // <
	| "ANGLE_BRACKET_CLOSE"  // >
	| "BRACKET_OPEN"         // [
	| "BRACKET_CLOSE"        // ]
	| "PAREN_OPEN"           // (
	| "PAREN_CLOSE"          // )
	| "BRACE_OPEN"           // {
	| "BRACE_CLOSE"          // }
	| "PIPE"                 // |
	| "DOUBLE_PIPE"          // ||
	| "AMPERSAND"            // &
	| "DOUBLE_AMPERSAND"     // &&
	| "QUESTION"             // ?
	| "ASTERISK"             // *
	| "PLUS"                 // +
	| "HASH"                 // #
	| "COMMA"                // ,
	| "EXCLAMATION"          // !
	| "IDENTIFIER"           // word
	| "STRING"               // "..." or '...'
	| "NUMBER"               // 123
	| "EOF";

interface Token {
	type: TokenType;
	value: string;
	pos: number;
}

// ============================================================================
// Lexer
// ============================================================================

class SyntaxLexer {
	private input: string;
	private pos: number = 0;
	private tokens: Token[] = [];

	constructor(input: string) {
		this.input = input;
	}

	lex(): Token[] {
		while (this.pos < this.input.length) {
			this.skipWhitespace();
			if (this.pos >= this.input.length) break;

			const token = this.nextToken();
			if (token) {
				this.tokens.push(token);
			}
		}

		this.tokens.push({ type: "EOF", value: "", pos: this.pos });
		return this.tokens;
	}

	private skipWhitespace(): void {
		while (this.pos < this.input.length && /\s/.test(this.input[this.pos]!)) {
			this.pos++;
		}
	}

	private nextToken(): Token | null {
		const start = this.pos;
		const char = this.input[this.pos];

		if (!char) return null;

		// Multi-character operators
		if (char === "|" && this.input[this.pos + 1] === "|") {
			this.pos += 2;
			return { type: "DOUBLE_PIPE", value: "||", pos: start };
		}

		if (char === "&" && this.input[this.pos + 1] === "&") {
			this.pos += 2;
			return { type: "DOUBLE_AMPERSAND", value: "&&", pos: start };
		}

		// Single-character operators
		const singleCharTokens: Record<string, TokenType> = {
			"<": "ANGLE_BRACKET_OPEN",
			">": "ANGLE_BRACKET_CLOSE",
			"[": "BRACKET_OPEN",
			"]": "BRACKET_CLOSE",
			"(": "PAREN_OPEN",
			")": "PAREN_CLOSE",
			"{": "BRACE_OPEN",
			"}": "BRACE_CLOSE",
			"|": "PIPE",
			"&": "AMPERSAND",
			"?": "QUESTION",
			"*": "ASTERISK",
			"+": "PLUS",
			"#": "HASH",
			",": "COMMA",
			"!": "EXCLAMATION",
		};

		if (singleCharTokens[char]) {
			this.pos++;
			return { type: singleCharTokens[char]!, value: char, pos: start };
		}

		// Numbers
		if (/\d/.test(char)) {
			return this.readNumber();
		}

		// Strings (quoted)
		if (char === '"' || char === "'") {
			return this.readString(char);
		}

		// Identifiers and keywords
		if (/[a-zA-Z_-]/.test(char)) {
			return this.readIdentifier();
		}

		// Unknown character, skip it
		this.pos++;
		return null;
	}

	private readNumber(): Token {
		const start = this.pos;
		while (this.pos < this.input.length && /\d/.test(this.input[this.pos]!)) {
			this.pos++;
		}
		return {
			type: "NUMBER",
			value: this.input.slice(start, this.pos),
			pos: start,
		};
	}

	private readString(quote: string): Token {
		const start = this.pos;
		this.pos++; // Skip opening quote
		
		while (this.pos < this.input.length && this.input[this.pos] !== quote) {
			this.pos++;
		}
		
		const value = this.input.slice(start + 1, this.pos);
		this.pos++; // Skip closing quote
		
		return { type: "STRING", value, pos: start };
	}

	private readIdentifier(): Token {
		const start = this.pos;
		while (
			this.pos < this.input.length &&
			/[a-zA-Z0-9_-]/.test(this.input[this.pos]!)
		) {
			this.pos++;
		}
		return {
			type: "IDENTIFIER",
			value: this.input.slice(start, this.pos),
			pos: start,
		};
	}
}

// ============================================================================
// Parser
// ============================================================================

type SyntaxNode =
	| { type: "reference"; name: string }
	| { type: "primitive"; name: string }
	| { type: "literal"; value: string }
	| { type: "group"; content: SyntaxNode[]; combinator: string }
	| { type: "optional"; content: SyntaxNode }
	| { type: "repeat"; content: SyntaxNode; min: number; max: number | null }
	| { type: "function"; name: string; args: SyntaxNode[] };

class SyntaxParser {
	private tokens: Token[];
	private pos: number = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
	}

	parse(): SyntaxNode[] {
		const nodes: SyntaxNode[] = [];
		
		while (this.current().type !== "EOF") {
			const node = this.parseExpression();
			if (node) {
				nodes.push(node);
			}
		}

		return nodes;
	}

	private current(): Token {
		return this.tokens[this.pos] ?? { type: "EOF", value: "", pos: -1 };
	}

	private consume(): Token {
		return this.tokens[this.pos++] ?? { type: "EOF", value: "", pos: -1 };
	}

	private expect(type: TokenType): Token {
		const token = this.current();
		if (token.type !== type) {
			throw new Error(`Expected ${type} but got ${token.type} at position ${token.pos}`);
		}
		return this.consume();
	}

	private parseExpression(): SyntaxNode | null {
		const terms: (SyntaxNode | null)[] = [];
		let combinator: string = " ";

		while (this.current().type !== "EOF") {
			// Check for combinator
			if (this.current().type === "PIPE" || this.current().type === "DOUBLE_PIPE") {
				combinator = "|";
				this.consume();
				continue;
			}
			if (this.current().type === "AMPERSAND" || this.current().type === "DOUBLE_AMPERSAND") {
				combinator = "&&";
				this.consume();
				continue;
			}

			// Parse term
			const term = this.parseTerm();
			if (term) {
				terms.push(term);
			} else {
				break;
			}
		}

		// Filter out null terms
		const validTerms = terms.filter((t): t is SyntaxNode => t !== null);

		if (validTerms.length === 0) return null;
		if (validTerms.length === 1) return validTerms[0]!;

		return { type: "group", content: validTerms, combinator };
	}

	private parseTerm(): SyntaxNode | null {
		let node: SyntaxNode | null = null;

		// Reference: <name>
		if (this.current().type === "ANGLE_BRACKET_OPEN") {
			this.consume(); // <
			const name = this.expect("IDENTIFIER").value;
			this.expect("ANGLE_BRACKET_CLOSE"); // >
			node = { type: "reference", name };
		}
		// Group: [...]
		else if (this.current().type === "BRACKET_OPEN") {
			this.consume(); // [
			const content = this.parseExpression();
			this.expect("BRACKET_CLOSE"); // ]
			if (content) {
				if (content.type === "group") {
					node = content;
				} else {
					node = { type: "group", content: [content], combinator: " " };
				}
			} else {
				return null;
			}
		}
		// Function: name()
		else if (this.current().type === "IDENTIFIER" && this.tokens[this.pos + 1]?.type === "PAREN_OPEN") {
			const name = this.consume().value;
			this.consume(); // (
			const args: SyntaxNode[] = [];
			while (this.current().type !== "PAREN_CLOSE" && this.current().type !== "EOF") {
				const arg = this.parseExpression();
				if (arg) args.push(arg);
			}
			this.expect("PAREN_CLOSE"); // )
			node = { type: "function", name, args };
		}
		// String literal
		else if (this.current().type === "STRING") {
			node = { type: "literal", value: this.consume().value };
		}
		// Identifier (could be keyword or primitive)
		else if (this.current().type === "IDENTIFIER") {
			const name = this.consume().value;
			// Check if it's a known primitive
			if (KNOWN_PRIMITIVES[name.toLowerCase()]) {
				node = { type: "primitive", name };
			} else {
				node = { type: "literal", value: name };
			}
		}
		// Unknown
		else {
			return null;
		}

		// Check for modifiers: ?, *, +, {}, #{}
		if (this.current().type === "QUESTION") {
			this.consume();
			return { type: "optional", content: node };
		}
		if (this.current().type === "ASTERISK") {
			this.consume();
			return { type: "repeat", content: node, min: 0, max: null };
		}
		if (this.current().type === "PLUS") {
			this.consume();
			return { type: "repeat", content: node, min: 1, max: null };
		}
		if (this.current().type === "HASH") {
			// Hash modifier: #{min,max} for comma-separated repetition
			this.consume(); // #
			if (this.current().type === "BRACE_OPEN") {
				this.consume(); // {
				const min = parseInt(this.expect("NUMBER").value);
				this.expect("COMMA"); // ,
				const maxStr = this.expect("NUMBER").value;
				const max = maxStr === "∞" ? null : parseInt(maxStr);
				this.expect("BRACE_CLOSE"); // }
				return { type: "repeat", content: node, min, max };
			}
			// Lone # means "zero or more comma-separated"
			return { type: "repeat", content: node, min: 0, max: null };
		}
		if (this.current().type === "BRACE_OPEN") {
			this.consume(); // {
			const min = parseInt(this.expect("NUMBER").value);
			this.expect("COMMA"); // ,
			const maxStr = this.expect("NUMBER").value;
			const max = maxStr === "∞" ? null : parseInt(maxStr);
			this.expect("BRACE_CLOSE"); // }
			return { type: "repeat", content: node, min, max };
		}

		return node;
	}
}

// ============================================================================
// AST Conversion
// ============================================================================

/**
 * Convert parsed syntax nodes to CSS AST types
 */
export function syntaxToAST(nodes: SyntaxNode[], name: string): CSSValueType | null {
	if (nodes.length === 0) return null;
	if (nodes.length === 1) {
		return nodeToAST(nodes[0]!, name);
	}

	// Multiple top-level nodes - treat as a group
	return nodesToComposite(nodes, "|", name);
}

function nodeToAST(node: SyntaxNode, name: string): CSSValueType | null {
	switch (node.type) {
		case "reference":
			// Create alias to referenced type
			return {
				type: "alias",
				name,
				target: createTypeRef(node.name),
			} as AliasType;

		case "primitive":
			const primitive = KNOWN_PRIMITIVES[node.name.toLowerCase()];
			if (primitive) {
				return primitive;
			}
			return createPrimitiveType(node.name, node.name);

		case "literal":
			// Single literal - create enum with one value
			return createEnumType(name, [node.value]);

		case "group":
			return nodesToComposite(node.content, node.combinator, name);

		case "optional":
			// Optional content - for now just unwrap
			return nodeToAST(node.content, name);

		case "repeat":
			// Repeated content - create array type
			const inner = nodeToAST(node.content, `${name}Item`);
			if (inner) {
				return {
					...inner,
					name,
				};
			}
			return null;

		case "function":
			// Function call - treat as composite
			return createCompositeType(
				name,
				[node.args.map((arg) => createTypeRef(arg.type))].flat().filter(Boolean)
			);

		default:
			return null;
	}
}

function nodesToComposite(nodes: SyntaxNode[], combinator: string, name: string): CSSValueType {
	// If using | combinator and all children are literals, create enum
	if (combinator === "|" && nodes.every((n) => n.type === "literal")) {
		const values = nodes.map((n) => (n as any).value as string);
		return createEnumType(name, values);
	}

	// Otherwise create composite type
	const memberRefs: TypeReference[] = [];
	for (const node of nodes) {
		switch (node.type) {
			case "reference":
				memberRefs.push(createTypeRef(node.name));
				break;
			case "primitive":
				memberRefs.push(createTypeRef(node.name));
				break;
			case "literal":
				memberRefs.push(createTypeRef(`"${node.value}"`));
				break;
		}
	}

	return createCompositeType(name, memberRefs);
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse a CSS syntax string and convert to AST
 */
export function parseSyntax(syntax: string): CSSValueType | null {
	const lexer = new SyntaxLexer(syntax);
	const tokens = lexer.lex();
	const parser = new SyntaxParser(tokens);
	const nodes = parser.parse();
	
	// Generate a name from the syntax content
	const name = syntax
		.replace(/[^a-zA-Z0-9_-]/g, "_")
		.replace(/_+/g, "_")
		.slice(0, 50);
	
	return syntaxToAST(nodes, name || "Anonymous");
}

/**
 * Parse all syntax definitions
 */
export function parseAllSyntaxes(
	definitions: Map<string, { name: string; syntax: string }>
): Map<string, CSSValueType> {
	const result = new Map<string, CSSValueType>();

	for (const [name, def] of definitions) {
		try {
			const ast = parseSyntax(def.syntax);
			if (ast) {
				result.set(name, ast);
			}
		} catch (err) {
			console.warn(`Failed to parse syntax for ${name}: ${err}`);
		}
	}

	return result;
}

// ============================================================================
// CLI Entry Point
// ============================================================================

if (import.meta.main) {
	// Test examples (excluding problematic ones for now)
	const examples = [
		"<length> | <percentage>",
		"none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset",
		"<color>",
		"[<length> | <percentage>]?",
	];

	console.log("=== CSS Syntax Parser Examples ===\n");

	for (const example of examples) {
		console.log(`Input: ${example}`);
		try {
			const ast = parseSyntax(example);
			console.log(`Output: ${ast?.type ?? "null"}`);
			if (ast) {
				console.log(`Name: ${ast.name}`);
			}
		} catch (err) {
			console.log(`Error: ${err}`);
		}
		console.log();
	}
}
