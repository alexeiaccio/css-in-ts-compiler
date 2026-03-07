import { Data } from "effect";

export class LexError extends Data.TaggedError("LexError")<{
	readonly message: string;
	readonly position: number;
	readonly source: string;
	readonly line?: number;
	readonly column?: number;
}> {}

export class CssParseError extends Data.TaggedError("CssParseError")<{
	readonly message: string;
	readonly token: {
		readonly token: string;
		readonly value: string;
		readonly pos: number;
		readonly end: number;
	};
	readonly expected?: readonly string[];
}> {
	override toString(): string {
		let msg = `CssParseError at position ${this.token.pos}: ${this.message}`;
		if (this.expected?.length) {
			msg += `\nExpected one of: ${this.expected.join(", ")}`;
		}
		return msg;
	}
}

export class UnexpectedTokenError extends Data.TaggedError("UnexpectedTokenError")<{
	readonly message: string;
	readonly position: number;
	readonly source: string;
	readonly found: string;
	readonly expected: readonly string[];
}> {}

export class InvalidSyntaxError extends Data.TaggedError("InvalidSyntaxError")<{
	readonly message: string;
	readonly position: number;
	readonly source: string;
}> {}

export class UnterminatedStringError extends Data.TaggedError("UnterminatedStringError")<{
	readonly position: number;
	readonly source: string;
}> {}

export class UnterminatedCommentError extends Data.TaggedError("UnterminatedCommentError")<{
	readonly position: number;
	readonly source: string;
}> {}

export class InvalidEscapeError extends Data.TaggedError("InvalidEscapeError")<{
	readonly position: number;
	readonly source: string;
}> {}

export class InvalidNumberError extends Data.TaggedError("InvalidNumberError")<{
	readonly message: string;
	readonly position: number;
	readonly source: string;
}> {}

export type CssSyntaxError =
	| LexError
	| CssParseError
	| UnexpectedTokenError
	| InvalidSyntaxError
	| UnterminatedStringError
	| UnterminatedCommentError
	| InvalidEscapeError
	| InvalidNumberError;
