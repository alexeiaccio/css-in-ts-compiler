/**
 * CSS.escape() utility
 *
 * Escapes a string for use as a CSS identifier
 * @spec CSSOM §8.1 - The CSS.escape() method
 *
 * @see https://drafts.csswg.org/cssom-1/#the-css.escape-method
 */

/**
 * Escape a string for use as a CSS identifier
 *
 * This static method can be used to escape a string for use in a CSS selector,
 * property name, or other CSS identifier context.
 *
 * @param ident - The identifier to escape
 * @returns The escaped identifier
 *
 * @spec CSSOM §8.1 - CSS.escape()
 * @see https://drafts.csswg.org/cssom-1/#the-css.escape-method
 *
 * @example
 * ```ts
 * escapeIdentifier("hello world"); // "hello\\20world"
 * escapeIdentifier("2fast");       // "\\32 fast"
 * escapeIdentifier(".class");      // "\\.class"
 * escapeIdentifier("#id");         // "\\#id"
 * ```
 */
export function escapeIdentifier(ident: string): string {
	let result = "";

	for (let i = 0; i < ident.length; i++) {
		const code = ident.charCodeAt(i);

		// Rule 1: NULL → REPLACEMENT CHARACTER
		if (code === 0x0000) {
			result += "\uFFFD";
		}
		// Rule 2: Control chars (0x0001-0x001F or 0x007F) → escape as code point
		else if ((code >= 0x0001 && code <= 0x001f) || code === 0x007f) {
			result += `\\${code.toString(16)}`;
		}
		// Rule 3: First char digit (0x0030-0x0039) → escape
		else if (i === 0 && code >= 0x0030 && code <= 0x0039) {
			result += `\\${code.toString(16)}`;
		}
		// Rule 4: Second char digit and first is - → escape
		else if (i === 1 && code >= 0x0030 && code <= 0x0039 && ident.charCodeAt(0) === 0x002d) {
			result += `\\${code.toString(16)}`;
		}
		// Rule 5: First char is - and no second → escape
		else if (i === 0 && code === 0x002d && ident.length === 1) {
			result += `\\${code.toString(16)}`;
		}
		// Rule 6: Allowed characters unchanged
		else if (
			code >= 0x0080 ||
			code === 0x002d || // -
			code === 0x005f || // _
			(code >= 0x0030 && code <= 0x0039) || // 0-9
			(code >= 0x0041 && code <= 0x005a) || // A-Z
			(code >= 0x0061 && code <= 0x007a) // a-z
		) {
			result += ident[i]!;
		}
		// Rule 7: Everything else → escape
		else {
			result += `\\${code.toString(16)}`;
		}
	}

	return result;
}
