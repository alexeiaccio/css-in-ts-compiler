/**
 * Token types for the lexer
 *
 * Using const object (unbash approach)
 */

export const Token = {
	EOF: 0,
	Ident: 1,
	Function: 2,
	AtKeyword: 3,
	Hash: 4,
	String: 5,
	Url: 6,
	Number: 7,
	Dimension: 8,
	Percentage: 9,
	UnicodeRange: 10,
	Comma: 11,
	Colon: 12,
	Semicolon: 13,
	Slash: 14,
	Asterisk: 15,
	Plus: 16,
	Minus: 17,
	Dollar: 18,
	Tilde: 19,
	Caret: 20,
	At: 21,
	LeftBracket: 22,
	RightBracket: 23,
	LeftParen: 24,
	RightParen: 25,
	LeftBrace: 26,
	RightBrace: 27,
	DoubleBar: 28,
	DoubleAmp: 29,
	Bar: 30,
	QuestionMark: 31,
	ExclamationMark: 32,
	HashMark: 33,
	Whitespace: 34,
	Comment: 35,
	CDOToken: 36,
	CDCToken: 37,
	BadString: 38,
	BadUrl: 39,
	Delim: 40,
} as const;

export type Token = typeof Token[keyof typeof Token];

export interface TokenValue {
	readonly token: Token;
	readonly value: string;
	readonly pos: number;
	readonly end: number;
	readonly name?: string;
	readonly fileDescriptor?: number;
}
