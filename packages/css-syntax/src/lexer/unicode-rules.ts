/**
 * CSS Syntax Level 3 Unicode character rules
 *
 * Based on CSS Syntax §4.3.3 Code points:
 * https://drafts.csswg.org/css-syntax-3/#code-points
 */

/**
 * Is this a name-start code point?
 *
 * Name-start code points include:
 * - Uppercase letters A-Z
 * - Lowercase letters a-z
 * - Underscore (_)
 * - U+00B7 (·) middle dot
 * - Non-ASCII letters (U+00C0-02FF, U+0370-037D, etc.)
 * - Zero-width joiners U+200C and U+200D
 *
 * See: https://drafts.csswg.org/css-syntax-3/#ident-start-diagram
 */
export const isNameStartCodePoint = (code: number): boolean => {
	if (code < 128) {
		return code === 95 || (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
	}

	return (
		isLetter(code) ||
		code === 0x00b7 || // · (middle dot)
		(code >= 0x00c0 && code <= 0x00d6) ||
		(code >= 0x00d8 && code <= 0x00f6) ||
		(code >= 0x00f8 && code <= 0x02ff) ||
		(code >= 0x0370 && code <= 0x037d) ||
		(code >= 0x037f && code <= 0x1fff) ||
		(code >= 0x200c && code <= 0x200d) || // Zero-width joiner/non-joiner
		(code >= 0x203f && code <= 0x2040) ||
		(code >= 0x2070 && code <= 0x218f) ||
		(code >= 0x2c00 && code <= 0x2fef) ||
		(code >= 0x3001 && code <= 0xd7ff) ||
		(code >= 0xf900 && code <= 0xfdcf) ||
		(code >= 0xfdf0 && code <= 0xfffd) ||
		(code >= 0x10000 && code <= 0xeffff)
	);
};

/**
 * Is this a name code point?
 *
 * Name code points include:
 * - All name-start code points
 * - Digits (0-9 and non-ASCII digits)
 * - Hyphen (-)
 *
 * See: https://drafts.csswg.org/css-syntax-3/#ident-token
 */
export const isNameCodePoint = (code: number): boolean => {
	if (code < 128) {
		return isNameStartCodePoint(code) || code === 45 || (code >= 48 && code <= 57);
	}

	return isNameStartCodePoint(code) || isNonAsciiDigit(code);
};

/**
 * Is this a letter?
 *
 * Matches CSS letter definition:
 * https://drafts.csswg.org/css-syntax-3/#letter
 */
export const isLetter = (code: number): boolean => {
	// Uppercase letters (A-Z)
	if (code >= 0x0041 && code <= 0x005a) return true;
	// Lowercase letters (a-z)
	if (code >= 0x0061 && code <= 0x007a) return true;

	// Non-ASCII letters (simplified version of spec)
	return (
		code == 170 || // Feminine ordinal indicator
		code == 181 || // Micro sign
		code == 186 || // Masculine ordinal indicator
		(code >= 0x00c0 && code <= 0x00d6) ||
		(code >= 0x00d8 && code <= 0x00f6) ||
		(code >= 0x00f8 && code <= 0x024f) ||
		code == 894 ||
		(code >= 0x0386 && code <= 0x038a) ||
		code == 908 ||
		(code >= 0x038e && code <= 0x03a1) ||
		(code >= 0x03a3 && code <= 0x03ff) ||
		(code >= 0x0400 && code <= 0x052f) ||
		(code >= 0x0531 && code <= 0x0556) ||
		code == 1369 ||
		(code >= 0x0561 && code <= 0x0587) ||
		(code >= 0x05b0 && code <= 0x05bd) ||
		code == 1471 ||
		(code >= 0x05c1 && code <= 0x05c2) ||
		(code >= 0x05c4 && code <= 0x05c5) ||
		code == 1479 ||
		(code >= 0x05d0 && code <= 0x05ea) ||
		(code >= 0x05f0 && code <= 0x05f2) ||
		(code >= 0x0610 && code <= 0x061a) ||
		(code >= 0x0620 && code <= 0x0657) ||
		(code >= 0x0659 && code <= 0x065f) ||
		(code >= 0x0660 && code <= 0x0669) ||
		(code >= 0x066e && code <= 0x06d3) ||
		(code >= 0x06d5 && code <= 0x06dc) ||
		(code >= 0x06df && code <= 0x06e4) ||
		(code >= 0x06e7 && code <= 0x06e8) ||
		(code >= 0x06ea && code <= 0x06fc) ||
		(code >= 0x06ff && code <= 0x0710) ||
		(code >= 0x0712 && code <= 0x072f) ||
		(code >= 0x074d && code <= 0x07a5) ||
		(code >= 0x07b1 && code <= 0x07b9) ||
		(code >= 0x07ca && code <= 0x07ea) ||
		(code >= 0x07f4 && code <= 0x07f5) ||
		(code >= 0x0800 && code <= 0x0815) ||
		code == 2074 ||
		code == 2084 ||
		code == 2088 ||
		(code >= 0x0840 && code <= 0x0858) ||
		(code >= 0x0860 && code <= 0x086a) ||
		(code >= 0x08a0 && code <= 0x08b4) ||
		(code >= 0x08b6 && code <= 0x08bd) ||
		(code >= 0x0900 && code <= 0x0950) ||
		(code >= 0x0958 && code <= 0x0963) ||
		(code >= 0x0966 && code <= 0x096f) ||
		(code >= 0x0981 && code <= 0x0983) ||
		(code >= 0x0985 && code <= 0x098c) ||
		(code >= 0x098f && code <= 0x0990) ||
		(code >= 0x09aa && code <= 0x09b0) ||
		(code >= 0x09b2 && code <= 0x09b9) ||
		(code >= 0x09be && code <= 0x09c4) ||
		(code >= 0x09c7 && code <= 0x09c8) ||
		(code >= 0x09cb && code <= 0x09ce) ||
		code == 2519 ||
		(code >= 0x09dc && code <= 0x09dd) ||
		(code >= 0x09df && code <= 0x09e3) ||
		(code >= 0x09e6 && code <= 0x09f1) ||
		(code >= 0x0a01 && code <= 0x0a03) ||
		(code >= 0x0a05 && code <= 0x0a0a) ||
		(code >= 0x0a0f && code <= 0x0a10) ||
		(code >= 0x0a13 && code <= 0x0a28) ||
		(code >= 0x0a2a && code <= 0x0a30) ||
		(code >= 0x0a32 && code <= 0x0a33) ||
		(code >= 0x0a35 && code <= 0x0a36) ||
		(code >= 0x0a38 && code <= 0x0a39) ||
		(code >= 0x0a3e && code <= 0x0a42) ||
		(code >= 0x0a47 && code <= 0x0a51) ||
		(code >= 0x0a59 && code <= 0x0a5c) ||
		code == 2654 ||
		(code >= 0x0a66 && code <= 0x0a74) ||
		(code >= 0x0a81 && code <= 0x0a83) ||
		(code >= 0x0a85 && code <= 0x0a8d) ||
		(code >= 0x0a8f && code <= 0xa91) ||
		(code >= 0x0a93 && code <= 0x0aa8) ||
		(code >= 0x0aaa && code <= 0x0ab0) ||
		(code >= 0x0ab2 && code <= 0x0ab3) ||
		(code >= 0x0ab5 && code <= 0x0ab9) ||
		(code >= 0x0abd && code <= 0x0ac5) ||
		(code >= 0x0abf && code <= 0x0abf9) ||
		(code >= 0x0abd && code <= 0x0acd) ||
		(code >= 0x0ae0 && code <= 0x0ae3) ||
		(code >= 0x0ae6 && code <= 0x0aef) ||
		(code >= 0x0b01 && code <= 0x0b03) ||
		(code >= 0x0b05 && code <= 0x0b0c) ||
		(code >= 0x0b0f && code <= 0x0b10) ||
		(code >= 0x0b13 && code <= 0x0b28) ||
		(code >= 0x0b2a && code <= 0x0b30) ||
		(code >= 0x0b32 && code <= 0x0b33) ||
		(code >= 0x0b35 && code <= 0x0b39) ||
		(code >= 0x0b3c && code <= 0x0b43) ||
		(code >= 0x0b47 && code <= 0x0b48) ||
		(code >= 0x0b4b && code <= 0x0b4d) ||
		(code >= 0x0b56 && code <= 0x0b57) ||
		(code >= 0x0b5c && code <= 0x0b5d) ||
		(code >= 0x0b5f && code <= 0x0b61) ||
		(code >= 0x0b71 && code <= 0x0b83) ||
		(code >= 0x0b85 && code <= 0x0b8a) ||
		(code >= 0x0b8e && code <= 0x0b90) ||
		(code >= 0x0b92 && code <= 0x0b95) ||
		(code >= 0x0b99 && code <= 0x0b9a) ||
		(code >= 0x0b9c && code <= 0x0b9e) ||
		code == 2975 ||
		(code >= 0x0ba3 && code <= 0x0ba4) ||
		(code >= 0x0ba8 && code <= 0x0baa) ||
		(code >= 0x0bae && code <= 0x0bb9) ||
		(code >= 0x0bbe && code <= 0x0bbf) ||
		code == 3008 ||
		(code >= 0x0bc1 && code <= 0x0bc2) ||
		(code >= 0x0bc6 && code <= 0x0bc8) ||
		(code >= 0x0bca && code <= 0x0bcd) ||
		(code >= 0x0d00 && code <= 0x0d0b) ||
		(code >= 0x0d0d && code <= 0x0d26) ||
		(code >= 0x0d28 && code <= 0x0d4a) ||
		(code >= 0x0d4c && code <= 0x0d4e) ||
		(code >= 0x0d54 && code <= 0x0d5f) ||
		(code >= 0x0d62 && code <= 0x0d63) ||
		(code >= 0x0d66 && code <= 0x0d78) ||
		(code >= 0x0d7a && code <= 0x0d7f) ||
		(code >= 0x0d82 && code <= 0x0d83) ||
		(code >= 0x0d85 && code <= 0x0d96) ||
		(code >= 0x0d9a && code <= 0x0d9b) ||
		(code >= 0x0d9c && code <= 0x0d9d) ||
		(code >= 0x0da2 && code <= 0x0da5) ||
		code == 3494 ||
		(code >= 0x0da8 && code <= 0x0dae) ||
		(code >= 0x0db0 && code <= 0x0dbd) ||
		(code >= 0x0dc0 && code <= 0x0dc6) ||
		code == 3535 ||
		(code >= 0x0dd2 && code <= 0x0dd4) ||
		code == 3542 ||
		(code >= 0x0dd8 && code <= 0x0ddf) ||
		(code >= 0x0df2 && code <= 0x0df3) ||
		(code >= 0x0e01 && code <= 0x0e3a) ||
		(code >= 0x0e3f && code <= 0x0e5b) ||
		(code >= 0x0e81 && code <= 0x0e82) ||
		code == 3716 ||
		(code >= 0x0e86 && code <= 0x0e8a) ||
		(code >= 0x0e8c && code <= 0x0ea3) ||
		code == 3749 ||
		(code >= 0x0ea7 && code <= 0x0eb0) ||
		(code >= 0x0eb2 && code <= 0x0eb3) ||
		code == 3773 ||
		(code >= 0x0ec0 && code <= 0x0ec4) ||
		code == 3782 ||
		(code >= 0x0ecc && code <= 0x0ecf) ||
		(code >= 0x0ce0 && code <= 0x0ce1) ||
		(code >= 0x0ce6 && code <= 0x0cef) ||
		(code >= 0x0cf1 && code <= 0x0cf2) ||
		(code >= 0x0cf4 && code <= 0x0cf5) ||
		false
	);
};

/**
 * Is this a non-ASCII digit?
 *
 * Non-ASCII digits used in various scripts
 */
export const isNonAsciiDigit = (code: number): boolean => {
	return (
		(code >= 0x0660 && code <= 0x0669) || // Arabic-Indic
		(code >= 0x06f0 && code <= 0x06f9) || // Extended Arabic-Indic
		(code >= 0x07c0 && code <= 0x07c9) || // Nko
		(code >= 0x0966 && code <= 0x096f) || // Devanagari
		(code >= 0x09e6 && code <= 0x09ef) || // Bengali
		(code >= 0x0a66 && code <= 0x0a6f) || // Gurmukhi
		(code >= 0x0ae6 && code <= 0x0aef) || // Gujarati
		(code >= 0x0b66 && code <= 0x0b6f) || // Oriya
		(code >= 0x0be6 && code <= 0x0bef) || // Tamil
		(code >= 0x0c66 && code <= 0x0c6f) || // Telugu
		(code >= 0x0ce6 && code <= 0x0cef) || // Kannada
		(code >= 0x0d66 && code <= 0x0d6f) || // Malayalam
		(code >= 0x0e50 && code <= 0x0e59) || // Thai
		(code >= 0x0ed0 && code <= 0x0ed9) || // Lao
		(code >= 0x0f20 && code <= 0x0f29) || // Tibetan
		(code >= 0x1040 && code <= 0x1049) || // Myanmar
		(code >= 0x1090 && code <= 0x1099) || // Myanmar Shan
		(code >= 0x17e0 && code <= 0x17e9) || // Khmer
		(code >= 0x1810 && code <= 0x1819) || // Mongolian
		(code >= 0x1946 && code <= 0x194f) || // Limbu
		(code >= 0x19d0 && code <= 0x19d9) || // New Tai Lue
		(code >= 0x1a80 && code <= 0x1a89) || // Tai Tham Hora
		(code >= 0x1a90 && code <= 0x1a99) || // Tai Tham Tham
		(code >= 0x1b50 && code <= 0x1b59) || // Balinese
		(code >= 0x1bb0 && code <= 0x1bb9) || // Sundanese
		(code >= 0x1c40 && code <= 0x1c49) || // Lepcha
		(code >= 0x1c50 && code <= 0x1c59) || // Ol Chiki
		(code >= 0xa620 && code <= 0xa629) || // Vai
		(code >= 0xa8d0 && code <= 0xa8d9) || // Saurashtra
		(code >= 0xa900 && code <= 0xa909) || // Kayah Li
		(code >= 0xa9d0 && code <= 0xa9d9) || // Rejang
		(code >= 0xa9f0 && code <= 0xa9f9) || // Javanese
		(code >= 0xaa50 && code <= 0xaa59) || // Cham
		(code >= 0xabf0 && code <= 0xabf9) || // Meetei Mayek
		(code >= 0xff10 && code <= 0xff19) // Fullwidth digits
	);
};

/**
 * Is this a digit?
 *
 * Combines ASCII and non-ASCII digits
 */
export const isDigit = (code: number): boolean => {
	if (code < 128) {
		return code >= 48 && code <= 57;
	}
	return isNonAsciiDigit(code);
};

/**
 * Is this a hex digit?
 *
 * Hex digits: 0-9, a-f, A-F
 */
export const isHexDigit = (code: number): boolean => {
	if (code < 128) {
		return (code >= 48 && code <= 57) || (code >= 65 && code <= 70) || (code >= 97 && code <= 102);
	}
	return false; // No non-ASCII hex digits
};

/**
 * Is this whitespace?
 *
 * Whitespace: space, tab, newline, carriage return, form feed
 */
export const isWhitespace = (code: number): boolean => {
	return code === 9 || code === 10 || code === 12 || code === 13 || code === 32;
};

/**
 * Check if two code points are a valid escape
 *
 * See: https://drafts.csswg.org/css-syntax-3/#check-if-two-code-points-are-a-valid-escape
 */
export const isValidEscape = (code1: number, code2: number): boolean => {
	return code1 === 92 && code2 !== 0; // backslash and not EOF
};

/**
 * Check if three code points would start an ident sequence
 *
 * See: https://drafts.csswg.org/css-syntax-3/#check-if-three-code-points-would-start-an-ident-sequence
 */
export const wouldStartIdentSequence = (code1: number, code2: number, code3: number): boolean => {
	// U+002D HYPHEN-MINUS
	if (code1 === 45) {
		// Name-start code point
		if (isNameStartCodePoint(code2)) return true;
		// U+002D HYPHEN-MINUS
		if (code2 === 45) return true;
		// Valid escape: backslash + any code point
		return isValidEscape(code2, code3);
	}
	// Name-start code point
	if (isNameStartCodePoint(code1)) return true;
	// U+005C REVERSE SOLIDUS (backslash)
	if (code1 === 92) return isValidEscape(code1, code2);
	return false;
};

/**
 * Check if three code points would start a number
 *
 * See: https://drafts.csswg.org/css-syntax-3/#check-if-three-code-points-would-start-a-number
 */
export const wouldStartNumber = (code1: number, code2: number, code3: number): boolean => {
	// U+002B PLUS SIGN
	if (code1 === 43 || code1 === 45) {
		// U+002D HYPHEN-MINUS or digit
		if (isDigit(code2)) return true;
		// U+002E FULL STOP followed by digit
		if (code2 === 46 && isDigit(code3)) return true;
	}
	// U+002E FULL STOP followed by digit
	if (code1 === 46 && isDigit(code2)) return true;
	// Digit
	return isDigit(code1);
};

/**
 * Consume an escaped code point
 *
 * See: https://drafts.csswg.org/css-syntax-3/#consume-an-escaped-code-point
 */
export const consumeEscapedCodePoint = (source: string, pos: number): { code: number; newPos: number } | null => {
	if (pos >= source.length) return null;

	const code = source.charCodeAt(pos);

	// EOF - return U+FFFD
	if (code === 0) {
		return { code: 0xfffd, newPos: pos + 1 };
	}

	// Hex digit - consume up to 6 hex digits
	if (isHexDigit(code)) {
		let hex = "";
		let i = 0;
		while (i < 6 && pos + i < source.length && isHexDigit(source.charCodeAt(pos + i))) {
			hex += source[pos + i]!;
			i++;
		}

		// Consume optional whitespace after hex digits
		let wsPos = pos + i;
		while (wsPos < source.length && isWhitespace(source.charCodeAt(wsPos))) {
			wsPos++;
		}

		const value = parseInt(hex, 16);
		// Valid: non-zero and not surrogate
		if (value !== 0 && (value < 0xd800 || value > 0xdfff)) {
			return { code: value, newPos: wsPos };
		}
		return { code: 0xfffd, newPos: wsPos };
	}

	// Any other code point
	return { code, newPos: pos + 1 };
};

/**
 * Is this a newline?
 *
 * Newline: U+000A LINE FEED, U+000D CARRIAGE RETURN, U+000C FORM FEED
 */
export const isNewline = (code: number): boolean => {
	return code === 10 || code === 13 || code === 12;
};
