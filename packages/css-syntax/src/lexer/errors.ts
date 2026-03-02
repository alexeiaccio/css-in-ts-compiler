/**
 * Error types for the lexer and parser
 */

export class LexError extends Error {
	readonly _tag = "LexError";
	constructor(
		override message: string,
		public readonly position: number,
		public readonly source: string,
		public readonly line?: number,
		public readonly column?: number
	) {
		super(message);
		this.name = "LexError";
	}
}
