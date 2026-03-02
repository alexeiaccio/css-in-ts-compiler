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
		code === 0x00B7 || // · (middle dot)
		(code >= 0x00C0 && code <= 0x00D6) ||
		(code >= 0x00D8 && code <= 0x00F6) ||
		(code >= 0x00F8 && code <= 0x02FF) ||
		(code >= 0x0370 && code <= 0x037D) ||
		(code >= 0x037F && code <= 0x1FFF) ||
		(code >= 0x200C && code <= 0x200D) || // Zero-width joiner/non-joiner
		(code >= 0x203F && code <= 0x2040) ||
		(code >= 0x2070 && code <= 0x218F) ||
		(code >= 0x2C00 && code <= 0x2FEF) ||
		(code >= 0x3001 && code <= 0xD7FF) ||
		(code >= 0xF900 && code <= 0xFDCF) ||
		(code >= 0xFDF0 && code <= 0xFFFD) ||
		(code >= 0x10000 && code <= 0xEFFFF)
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
	if (code >= 0x0041 && code <= 0x005A) return true;
	// Lowercase letters (a-z)
	if (code >= 0x0061 && code <= 0x007A) return true;

	// Non-ASCII letters (simplified version of spec)
	return (
		(code >= 0x00AA && code <= 0x00AA) || // Feminine ordinal indicator
		(code >= 0x00B5 && code <= 0x00B5) || // Micro sign
		(code >= 0x00BA && code <= 0x00BA) || // Masculine ordinal indicator
		(code >= 0x00C0 && code <= 0x00D6) ||
		(code >= 0x00D8 && code <= 0x00F6) ||
		(code >= 0x00F8 && code <= 0x024F) ||
		(code >= 0x037E && code <= 0x037E) ||
		(code >= 0x0386 && code <= 0x038A) ||
		(code >= 0x038C && code <= 0x038C) ||
		(code >= 0x038E && code <= 0x03A1) ||
		(code >= 0x03A3 && code <= 0x03FF) ||
		(code >= 0x0400 && code <= 0x052F) ||
		(code >= 0x0531 && code <= 0x0556) ||
		(code >= 0x0559 && code <= 0x0559) ||
		(code >= 0x0561 && code <= 0x0587) ||
		(code >= 0x05B0 && code <= 0x05BD) ||
		(code >= 0x05BF && code <= 0x05BF) ||
		(code >= 0x05C1 && code <= 0x05C2) ||
		(code >= 0x05C4 && code <= 0x05C5) ||
		(code >= 0x05C7 && code <= 0x05C7) ||
		(code >= 0x05D0 && code <= 0x05EA) ||
		(code >= 0x05F0 && code <= 0x05F2) ||
		(code >= 0x0610 && code <= 0x061A) ||
		(code >= 0x0620 && code <= 0x0657) ||
		(code >= 0x0659 && code <= 0x065F) ||
		(code >= 0x0660 && code <= 0x0669) ||
		(code >= 0x066E && code <= 0x06D3) ||
		(code >= 0x06D5 && code <= 0x06DC) ||
		(code >= 0x06DF && code <= 0x06E4) ||
		(code >= 0x06E7 && code <= 0x06E8) ||
		(code >= 0x06EA && code <= 0x06FC) ||
		(code >= 0x06FF && code <= 0x0710) ||
		(code >= 0x0712 && code <= 0x072F) ||
		(code >= 0x074D && code <= 0x07A5) ||
		(code >= 0x07B1 && code <= 0x07B9) ||
		(code >= 0x07CA && code <= 0x07EA) ||
		(code >= 0x07F4 && code <= 0x07F5) ||
		(code >= 0x0800 && code <= 0x0815) ||
		(code >= 0x081A && code <= 0x081A) ||
		(code >= 0x0824 && code <= 0x0824) ||
		(code >= 0x0828 && code <= 0x0828) ||
		(code >= 0x0840 && code <= 0x0858) ||
		(code >= 0x0860 && code <= 0x086A) ||
		(code >= 0x08A0 && code <= 0x08B4) ||
		(code >= 0x08B6 && code <= 0x08BD) ||
		(code >= 0x0900 && code <= 0x0950) ||
		(code >= 0x0958 && code <= 0x0963) ||
		(code >= 0x0966 && code <= 0x096F) ||
		(code >= 0x0981 && code <= 0x0983) ||
		(code >= 0x0985 && code <= 0x098C) ||
		(code >= 0x098F && code <= 0x0990) ||
		(code >= 0x09AA && code <= 0x09B0) ||
		(code >= 0x09B2 && code <= 0x09B9) ||
		(code >= 0x09BE && code <= 0x09C4) ||
		(code >= 0x09C7 && code <= 0x09C8) ||
		(code >= 0x09CB && code <= 0x09CE) ||
		(code >= 0x09D7 && code <= 0x09D7) ||
		(code >= 0x09DC && code <= 0x09DD) ||
		(code >= 0x09DF && code <= 0x09E3) ||
		(code >= 0x09E6 && code <= 0x09F1) ||
		(code >= 0x0A01 && code <= 0x0A03) ||
		(code >= 0x0A05 && code <= 0x0A0A) ||
		(code >= 0x0A0F && code <= 0x0A10) ||
		(code >= 0x0A13 && code <= 0x0A28) ||
		(code >= 0x0A2A && code <= 0x0A30) ||
		(code >= 0x0A32 && code <= 0x0A33) ||
		(code >= 0x0A35 && code <= 0x0A36) ||
		(code >= 0x0A38 && code <= 0x0A39) ||
		(code >= 0x0A3E && code <= 0x0A42) ||
		(code >= 0x0A47 && code <= 0x0A51) ||
		(code >= 0x0A59 && code <= 0x0A5C) ||
		(code >= 0x0A5E && code <= 0x0A5E) ||
		(code >= 0x0A66 && code <= 0x0A74) ||
		(code >= 0x0A81 && code <= 0x0A83) ||
		(code >= 0x0A85 && code <= 0x0A8D) ||
		(code >= 0x0A8F && code <= 0xA91) ||
		(code >= 0x0A93 && code <= 0x0AA8) ||
		(code >= 0x0AAA && code <= 0x0AB0) ||
		(code >= 0x0AB2 && code <= 0x0AB3) ||
		(code >= 0x0AB5 && code <= 0x0AB9) ||
		(code >= 0x0ABD && code <= 0x0AC5) ||
		(code >= 0x0ABF && code <= 0x0ABF9) ||
		(code >= 0x0ABD && code <= 0x0ACD) ||
		(code >= 0x0AE0 && code <= 0x0AE3) ||
		(code >= 0x0AE6 && code <= 0x0AEF) ||
		(code >= 0x0B01 && code <= 0x0B03) ||
		(code >= 0x0B05 && code <= 0x0B0C) ||
		(code >= 0x0B0F && code <= 0x0B10) ||
		(code >= 0x0B13 && code <= 0x0B28) ||
		(code >= 0x0B2A && code <= 0x0B30) ||
		(code >= 0x0B32 && code <= 0x0B33) ||
		(code >= 0x0B35 && code <= 0x0B39) ||
		(code >= 0x0B3C && code <= 0x0B43) ||
		(code >= 0x0B47 && code <= 0x0B48) ||
		(code >= 0x0B4B && code <= 0x0B4D) ||
		(code >= 0x0B56 && code <= 0x0B57) ||
		(code >= 0x0B5C && code <= 0x0B5D) ||
		(code >= 0x0B5F && code <= 0x0B61) ||
		(code >= 0x0B71 && code <= 0x0B83) ||
		(code >= 0x0B85 && code <= 0x0B8A) ||
		(code >= 0x0B8E && code <= 0x0B90) ||
		(code >= 0x0B92 && code <= 0x0B95) ||
		(code >= 0x0B99 && code <= 0x0B9A) ||
		(code >= 0x0B9C && code <= 0x0B9E) ||
		(code >= 0x0B9F && code <= 0x0B9F) ||
		(code >= 0x0BA3 && code <= 0x0BA4) ||
		(code >= 0x0BA8 && code <= 0x0BAA) ||
		(code >= 0x0BAE && code <= 0x0BB9) ||
		(code >= 0x0BBE && code <= 0x0BBF) ||
		(code >= 0x0BC0 && code <= 0x0BC0) ||
		(code >= 0x0BC1 && code <= 0x0BC2) ||
		(code >= 0x0BC6 && code <= 0x0BC8) ||
		(code >= 0x0BCA && code <= 0x0BCD) ||
		(code >= 0x0D00 && code <= 0x0D0B) ||
		(code >= 0x0D0D && code <= 0x0D26) ||
		(code >= 0x0D28 && code <= 0x0D4A) ||
		(code >= 0x0D4C && code <= 0x0D4E) ||
		(code >= 0x0D54 && code <= 0x0D5F) ||
		(code >= 0x0D62 && code <= 0x0D63) ||
		(code >= 0x0D66 && code <= 0x0D78) ||
		(code >= 0x0D7A && code <= 0x0D7F) ||
		(code >= 0x0D82 && code <= 0x0D83) ||
		(code >= 0x0D85 && code <= 0x0D96) ||
		(code >= 0x0D9A && code <= 0x0D9B) ||
		(code >= 0x0D9C && code <= 0x0D9D) ||
		(code >= 0x0D9E && code <= 0x09F0) ||
		(code >= 0x0D9F && code <= 0x09F1) ||
		(code >= 0x0DA2 && code <= 0x0DA5) ||
		(code >= 0x0DA6 && code <= 0x0DA6) ||
		(code >= 0x0DA8 && code <= 0x0DAE) ||
		(code >= 0x0DB0 && code <= 0x0DBD) ||
		(code >= 0x0DC0 && code <= 0x0DC6) ||
		(code >= 0x0DCF && code <= 0x0DCF) ||
		(code >= 0x0DD2 && code <= 0x0DD4) ||
		(code >= 0x0DD6 && code <= 0x0DD6) ||
		(code >= 0x0DD8 && code <= 0x0DDF) ||
		(code >= 0x0DF2 && code <= 0x0DF3) ||
		(code >= 0x0E01 && code <= 0x0E3A) ||
		(code >= 0x0E3F && code <= 0x0E5B) ||
		(code >= 0x0E81 && code <= 0x0E82) ||
		(code >= 0x0E84 && code <= 0x0E84) ||
		(code >= 0x0E86 && code <= 0x0E8A) ||
		(code >= 0x0E8C && code <= 0x0EA3) ||
		(code >= 0x0EA5 && code <= 0x0EA5) ||
		(code >= 0x0EA7 && code <= 0x0EB0) ||
		(code >= 0x0EB2 && code <= 0x0EB3) ||
		(code >= 0x0EBD && code <= 0x0EBD) ||
		(code >= 0x0EC0 && code <= 0x0EC4) ||
		(code >= 0x0EC6 && code <= 0x0EC6) ||
		(code >= 0x0ECC && code <= 0x0CCD) ||
		(code >= 0x0CE0 && code <= 0x0CE1) ||
		(code >= 0x0CE6 && code <= 0x0CEF) ||
		(code >= 0x0CF1 && code <= 0x0CF2) ||
		(code >= 0x0CF4 && code <= 0x0CF5) ||
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
		(code >= 0x06F0 && code <= 0x06F9) || // Extended Arabic-Indic
		(code >= 0x07C0 && code <= 0x07C9) || // Nko
		(code >= 0x0966 && code <= 0x096F) || // Devanagari
		(code >= 0x09E6 && code <= 0x09EF) || // Bengali
		(code >= 0x0A66 && code <= 0x0A6F) || // Gurmukhi
		(code >= 0x0AE6 && code <= 0x0AEF) || // Gujarati
		(code >= 0x0B66 && code <= 0x0B6F) || // Oriya
		(code >= 0x0BE6 && code <= 0x0BEF) || // Tamil
		(code >= 0x0C66 && code <= 0x0C6F) || // Telugu
		(code >= 0x0CE6 && code <= 0x0CEF) || // Kannada
		(code >= 0x0D66 && code <= 0x0D6F) || // Malayalam
		(code >= 0x0E50 && code <= 0x0E59) || // Thai
		(code >= 0x0ED0 && code <= 0x0ED9) || // Lao
		(code >= 0x0F20 && code <= 0x0F29) || // Tibetan
		(code >= 0x1040 && code <= 0x1049) || // Myanmar
		(code >= 0x1090 && code <= 0x1099) || // Myanmar Shan
		(code >= 0x17E0 && code <= 0x17E9) || // Khmer
		(code >= 0x1810 && code <= 0x1819) || // Mongolian
		(code >= 0x1946 && code <= 0x194F) || // Limbu
		(code >= 0x19D0 && code <= 0x19D9) || // New Tai Lue
		(code >= 0x1A80 && code <= 0x1A89) || // Tai Tham Hora
		(code >= 0x1A90 && code <= 0x1A99) || // Tai Tham Tham
		(code >= 0x1B50 && code <= 0x1B59) || // Balinese
		(code >= 0x1BB0 && code <= 0x1BB9) || // Sundanese
		(code >= 0x1C40 && code <= 0x1C49) || // Lepcha
		(code >= 0x1C50 && code <= 0x1C59) || // Ol Chiki
		(code >= 0xA620 && code <= 0xA629) || // Vai
		(code >= 0xA8D0 && code <= 0xA8D9) || // Saurashtra
		(code >= 0xA900 && code <= 0xA909) || // Kayah Li
		(code >= 0xA9D0 && code <= 0xA9D9) || // Rejang
		(code >= 0xA9F0 && code <= 0xA9F9) || // Javanese
		(code >= 0xAA50 && code <= 0xAA59) || // Cham
		(code >= 0xABF0 && code <= 0xABF9) || // Meetei Mayek
		(code >= 0xFF10 && code <= 0xFF19) // Fullwidth digits
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
		return { code: 0xFFFD, newPos: pos + 1 };
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
		if (value !== 0 && (value < 0xD800 || value > 0xDFFF)) {
			return { code: value, newPos: wsPos };
		}
		return { code: 0xFFFD, newPos: wsPos };
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
