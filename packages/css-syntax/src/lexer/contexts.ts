/**
 * Lexer contexts for context-sensitive tokenization
 *
 * Different parsing contexts require different tokenization rules
 * Using const object (unbash approach)
 */

export const LexContext = {
	Normal: 0,
	ValueDef: 1,
	Declaration: 2,
	Selector: 3,
	MediaQuery: 4,
	Function: 5,
	Url: 6,
	TestMode: 7,
} as const;

export type LexContext = (typeof LexContext)[keyof typeof LexContext];
