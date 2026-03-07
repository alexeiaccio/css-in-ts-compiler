/**
 * Character classification table using Uint8Array for O(1) lookups
 *
 * Based on CSS Syntax Level 3 §4.3:
 * https://drafts.csswg.org/css-syntax-3/#token-diagram
 *
 * Inspired by unbash's lexer architecture
 */

// Character category flags (bitmask for Uint8Array)
export const CHAR_WS = 1; // Whitespace (newline, space, tab)
export const CHAR_NAME_START = 2; // Can start an identifier (name-start code point)
export const CHAR_NAME_CONTINUE = 4; // Can continue identifier (name code point)
export const CHAR_DIGIT = 8; // Decimal digit (0-9)
export const CHAR_HEX = 16; // Hex digit (0-9, a-f, A-F)
export const CHAR_META = 32; // Metacharacter (token delimiter/operator)
export const CHAR_NON_PRINT = 64; // Non-printable (control chars, except whitespace)
export const CHAR_QUOTE = 128; // Quote character (' or ")

// Lookup table for ASCII (0-255)
export const CHAR_TABLE = new Uint8Array(256);

// Initialize ASCII portion (0-127)
for (let code = 0; code < 128; code++) {
	let flags = 0;

	// Whitespace: \t (9), \n (10), \f (12), \r (13), space (32)
	if (code === 9 || code === 10 || code === 12 || code === 13 || code === 32) {
		flags |= CHAR_WS;
	}

	// Name start: a-z, A-Z, _ (95)
	else if ((code >= 97 && code <= 122) || (code >= 65 && code <= 90) || code === 95) {
		flags |= CHAR_NAME_START | CHAR_NAME_CONTINUE;
	}

	// Name continue: - (45), digits
	else if (code === 45 || (code >= 48 && code <= 57)) {
		flags |= CHAR_NAME_CONTINUE;
	}

	// Digits: 0-9
	if (code >= 48 && code <= 57) {
		flags |= CHAR_DIGIT;
	}

	// Hex digits: 0-9, a-f, A-F
	if ((code >= 48 && code <= 57) || (code >= 97 && code <= 102) || (code >= 65 && code <= 70)) {
		flags |= CHAR_HEX;
	}

	// Metacharacters (token delimiters/operators)
	if (
		[33, 34, 35, 38, 39, 40, 41, 42, 43, 44, 58, 59, 61, 60, 62, 64, 91, 93, 123, 124, 125, 47, 46, 37].includes(code)
	) {
		flags |= CHAR_META;
	}

	// Quotes: ' (39), " (34)
	if (code === 39 || code === 34) {
		flags |= CHAR_QUOTE;
	}

	// Non-printable (control chars except whitespace)
	if (code <= 8 || (code >= 11 && code <= 31)) {
		flags |= CHAR_NON_PRINT;
	}

	CHAR_TABLE[code] = flags;
}

// Extended ASCII (128-255) - handled via Unicode checks
for (let code = 128; code < 256; code++) {
	CHAR_TABLE[code] = 0; // Will use Unicode checks
}
