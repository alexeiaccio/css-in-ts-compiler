/**
 * Main lexer implementation using Uint8Array character classification
 *
 * Based on unbash architecture with O(1) Uint8Array lookups
 */

import type { TokenValue } from "./token.js";

import { CHAR_TABLE, CHAR_NAME_START, CHAR_NAME_CONTINUE, CHAR_DIGIT, CHAR_WS } from "./char-table.js";
import { LexContext } from "./contexts.js";
import { Token } from "./token.js";
import { isNameStartCodePoint, isNameCodePoint, isDigit, isWhitespace } from "./unicode-rules.js";

// Fast ASCII lookup helpers (unbash approach)
const isWs = (code: number): boolean => (code < 128 ? (CHAR_TABLE[code]! & CHAR_WS) !== 0 : isWhitespace(code));

const isNameStart = (code: number): boolean =>
	code < 128 ? (CHAR_TABLE[code]! & CHAR_NAME_START) !== 0 : isNameStartCodePoint(code);

const isNameCont = (code: number): boolean =>
	code < 128 ? (CHAR_TABLE[code]! & CHAR_NAME_CONTINUE) !== 0 : isNameCodePoint(code);

const isDigitFast = (code: number): boolean => (code < 128 ? (CHAR_TABLE[code]! & CHAR_DIGIT) !== 0 : isDigit(code));

export class Lexer {
	private source: string;
	private pos: number;
	private _errors: Array<{ message: string; pos: number }> | null = null;

	constructor(source: string) {
		this.source = source;
		this.pos = 0;
	}

	charCodeAt(pos: number): number {
		return pos < this.source.length ? this.source.charCodeAt(pos) : 0;
	}

	charCode(): number {
		return this.charCodeAt(this.pos);
	}

	nextCharCode(offset = 1): number {
		return this.charCodeAt(this.pos + offset);
	}

	getPos(): number {
		return this.pos;
	}

	getSource(): string {
		return this.source;
	}

	get length(): number {
		return this.source.length;
	}

	get errors(): Array<{ message: string; pos: number }> | null {
		return this._errors;
	}

	private error(message: string): never {
		const err = { message, pos: this.pos };
		if (this._errors === null) {
			throw err;
		}
		this._errors.push(err);
		throw err;
	}

	skipWs(): void {
		while (this.pos < this.source.length) {
			const code = this.charCode();
			if (!isWs(code)) {
				break;
			}
			this.pos++;
		}
	}

	findWsEnd(pos: number): number {
		while (pos < this.source.length) {
			const code = this.source.charCodeAt(pos);
			if (!isWs(code)) {
				break;
			}
			pos++;
		}
		return pos;
	}

	eat(code: number): void {
		if (this.charCode() !== code) {
			this.error(`Expected '${String.fromCharCode(code)}'`);
		}
		this.pos++;
	}

	scanWord(): string {
		const start = this.pos;

		while (this.pos < this.source.length) {
			const code = this.charCode();
			if (!isNameCont(code)) {
				break;
			}
			this.pos++;
		}

		if (this.pos === start) {
			this.error("Expected a keyword");
		}

		return this.source.slice(start, this.pos);
	}

	next(ctx: LexContext): TokenValue {
		const startPos = this.pos;

		this.skipWs();

		if (this.pos >= this.source.length) {
			return { token: Token.EOF, value: "", pos: this.pos, end: this.pos };
		}

		const code = this.charCode();

		if ((code === 39 || code === 34) && ctx !== LexContext.ValueDef) {
			this.pos++;
			return this.scanStringToken(code);
		}

		if (isNameStart(code)) {
			return this.scanIdent(ctx);
		}

		if (isDigitFast(code)) {
			return this.scanNumber(ctx);
		}

		if (code === 46 && this.source.length > this.pos + 1) {
			const nextCode = this.source.charCodeAt(this.pos + 1);
			if (isDigitFast(nextCode)) {
				return this.scanNumber(ctx);
			}
		}

		if (code === 45) {
			const nextCode = this.source.charCodeAt(this.pos + 1);
			if (isDigitFast(nextCode)) {
				return this.scanNumber(ctx);
			}
			if (isNameStart(nextCode)) {
				return this.scanIdent(ctx);
			}
		}

		if (code === 64 && this.source.length > this.pos + 1) {
			const nextCode = this.source.charCodeAt(this.pos + 1);
			if (isNameStart(nextCode)) {
				return this.scanIdent(ctx);
			}
		}

		// CDO: <!-- (Comment Start) - only in certain contexts
		if (code === 33 && this.source.length > this.pos + 2) {
			if (
				this.source.charCodeAt(this.pos + 1) === 33 &&
				this.source.charCodeAt(this.pos + 2) === 45 &&
				this.source.charCodeAt(this.pos + 3) === 45
			) {
				this.pos += 4;
				return { token: Token.CDOToken, value: "<!--", pos: startPos, end: this.pos };
			}
		}

		// CDC: --> (Comment End)
		if (code === 45 && this.source.length > this.pos + 2) {
			if (this.source.charCodeAt(this.pos + 1) === 45 && this.source.charCodeAt(this.pos + 2) === 62) {
				this.pos += 3;
				return { token: Token.CDCToken, value: "-->", pos: startPos, end: this.pos };
			}
		}

		if (
			code === 124 ||
			code === 38 ||
			code === 47 ||
			code === 33 ||
			code === 35 ||
			code === 40 ||
			code === 41 ||
			code === 42 ||
			code === 43 ||
			code === 44 ||
			code === 45 ||
			code === 58 ||
			code === 59 ||
			code === 60 ||
			code === 62 ||
			code === 63 ||
			code === 64 ||
			code === 91 ||
			code === 93 ||
			code === 123 ||
			code === 125 ||
			code === 33
		) {
			if (code === 47 && this.nextCharCode() === 42) {
				return this.scanComment(startPos);
			}
			this.pos++;
			return this.scanMetaChar(code, startPos);
		}

		this.pos++;
		return {
			token: Token.Delim,
			value: this.source.slice(startPos, this.pos),
			pos: startPos,
			end: this.pos,
		};
	}

	peek(ctx: LexContext): TokenValue {
		const savedPos = this.pos;
		const token = this.next(ctx);
		this.pos = savedPos;
		return token;
	}

	private scanMetaChar(code: number, startPos: number): TokenValue {
		const ch = String.fromCharCode(code);

		if (code === 124 && this.charCode() === 124) {
			this.pos++;
			return { token: Token.DoubleBar, value: "||", pos: startPos, end: this.pos };
		}

		if (code === 38 && this.charCode() === 38) {
			this.pos++;
			return { token: Token.DoubleAmp, value: "&&", pos: startPos, end: this.pos };
		}

		if (code === 47 && this.nextCharCode() === 42) {
			return this.scanComment(startPos);
		}

		if (code === 39) {
			this.pos++;
			return { token: Token.BadString, value: ch, pos: startPos, end: this.pos };
		}

		const tokenMap: Record<number, Token> = {
			33: Token.ExclamationMark,
			35: Token.HashMark,
			40: Token.LeftParen,
			41: Token.RightParen,
			42: Token.Asterisk,
			43: Token.Plus,
			44: Token.Comma,
			45: Token.Minus,
			58: Token.Colon,
			59: Token.Semicolon,
			63: Token.QuestionMark,
			91: Token.LeftBracket,
			93: Token.RightBracket,
			64: Token.At,
			123: Token.LeftBrace,
			124: Token.Bar,
			125: Token.RightBrace,
		};

		return {
			token: tokenMap[code] ?? Token.Delim,
			value: ch,
			pos: startPos,
			end: this.pos,
		};
	}

	private scanIdent(_ctx: LexContext): TokenValue {
		const startPos = this.pos;
		const code = this.charCode();

		if (code === 45 || code === 64) {
			this.pos++;
		}

		while (this.pos < this.source.length) {
			const c = this.charCode();
			if (isNameCont(c)) {
				this.pos++;
			} else if (c === 45) {
				this.pos++;
			} else {
				break;
			}
		}

		const value = this.source.slice(startPos, this.pos);

		if (this.charCode() === 40) {
			this.pos++;
			return { token: Token.Function, value, pos: startPos, end: this.pos, name: value };
		}

		if (value.startsWith("@")) {
			return { token: Token.AtKeyword, value, pos: startPos, end: this.pos, name: value.slice(1) };
		}

		return { token: Token.Ident, value, pos: startPos, end: this.pos };
	}

	private scanNumber(ctx: LexContext): TokenValue {
		const startPos = this.pos;

		if (this.charCode() === 43 || this.charCode() === 45) {
			this.pos++;
		}

		while (this.pos < this.source.length && isDigitFast(this.charCode())) {
			this.pos++;
		}

		if (this.charCode() === 46) {
			this.pos++;
			while (this.pos < this.source.length && isDigitFast(this.charCode())) {
				this.pos++;
			}
		}

		if (this.charCode() === 69 || this.charCode() === 101) {
			this.pos++;
			if (this.charCode() === 43 || this.charCode() === 45) {
				this.pos++;
			}
			while (this.pos < this.source.length && isDigitFast(this.charCode())) {
				this.pos++;
			}
		}

		if (this.charCode() === 37) {
			this.pos++;
			return {
				token: Token.Percentage,
				value: this.source.slice(startPos, this.pos),
				pos: startPos,
				end: this.pos,
			};
		}

		if (this.pos < this.source.length && isNameStart(this.charCode())) {
			const unitStart = this.pos;
			this.scanIdent(ctx);
			const unit = this.source.slice(unitStart, this.pos);

			if (unit === "%") {
				return {
					token: Token.Percentage,
					value: this.source.slice(startPos, this.pos),
					pos: startPos,
					end: this.pos,
				};
			}

			return {
				token: Token.Dimension,
				value: this.source.slice(startPos, this.pos),
				pos: startPos,
				end: this.pos,
			};
		}

		return {
			token: Token.Number,
			value: this.source.slice(startPos, this.pos),
			pos: startPos,
			end: this.pos,
		};
	}

	private scanStringToken(quoteCode: number): TokenValue {
		const startPos = this.pos;
		const valueStart = this.pos;
		this.pos++;

		while (this.pos < this.source.length) {
			const code = this.charCode();

			if (code === quoteCode) {
				const value = this.source.slice(valueStart, this.pos);
				this.pos++;
				return {
					token: Token.String,
					value,
					pos: startPos,
					end: this.pos,
				};
			}

			if (code === 92) {
				this.pos++;
				if (this.pos < this.source.length) {
					this.pos++;
				}
			} else if (code === 10 || code === 13) {
				this.error("Unterminated string");
			} else {
				this.pos++;
			}
		}

		this.error("Unterminated string");
	}

	private scanComment(startPos: number): TokenValue {
		this.pos += 2;

		while (this.pos < this.source.length) {
			if (this.charCode() === 42 && this.nextCharCode() === 47) {
				this.pos += 2;
				return {
					token: Token.Comment,
					value: this.source.slice(startPos, this.pos),
					pos: startPos,
					end: this.pos,
				};
			}
			this.pos++;
		}

		this.error("Unterminated comment");
	}
}
