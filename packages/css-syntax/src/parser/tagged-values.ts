/**
 * CSS value objects with pre-computed AST
 *
 * Combines runtime value with pre-computed AST for zero-cost serialization
 *
 * @internal These are domain-specific value types with embedded serialization
 */

/**
 * Length value schema
 *
 * @spec https://drafts.csswg.org/css-values-4/#typedef-length
 */
export class Length {
	public readonly value: number;
	public readonly ast: {
		type: "dimension";
		value: string;
		number: number;
		unit: string;
	};

	/**
	 * Create a Length value with pre-computed AST
	 *
	 * @param value - Numeric value in specified unit
	 * @param unit - CSS unit (px, em, rem, etc.)
	 * @returns Length instance
	 *
	 * @see https://drafts.csswg.org/css-values-4/#length-units
	 */
	constructor(value: number, unit: string) {
		this.value = value;
		this.ast = {
			type: "dimension",
			value: value.toString(),
			number: value,
			unit,
		};
	}
}

/**
 * Angle value
 *
 * @spec https://drafts.csswg.org/css-values-4/#typedef-angle
 */
export class Angle {
	public readonly value: number;
	public readonly ast: {
		type: "dimension";
		value: string;
		number: number;
		unit: "deg" | "rad" | "grad" | "turn";
	};

	/**
	 * Create an angle value
	 *
	 * @param value - Numeric angle value
	 * @param unit - Angle unit
	 * @returns Angle instance
	 *
	 * @see https://drafts.csswg.org/css-values-4/#typedef-angle
	 */
	constructor(value: number, unit: "deg" | "rad" | "grad" | "turn") {
		this.value = value;
		this.ast = {
			type: "dimension",
			value: value.toString(),
			number: value,
			unit,
		};
	}
}

/**
 * Time value
 *
 * @spec https://drafts.csswg.org/css-values-4/#typedef-time
 */
export class Time {
	public readonly value: number;
	public readonly ast: {
		type: "dimension";
		value: string;
		number: number;
		unit: "s" | "ms";
	};

	/**
	 * Create a time value
	 *
	 * @param value - Numeric time value
	 * @param unit - Time unit (s or ms)
	 * @returns Time instance
	 *
	 * @see https://drafts.csswg.org/css-values-4/#typedef-time
	 */
	constructor(value: number, unit: "s" | "ms") {
		this.value = value;
		this.ast = {
			type: "dimension",
			value: value.toString(),
			number: value,
			unit,
		};
	}
}

/**
 * Frequency value
 *
 * @spec https://drafts.csswg.org/css-values-4/#typedef-frequency
 */
export class Frequency {
	public readonly value: number;
	public readonly ast: {
		type: "dimension";
		value: string;
		number: number;
		unit: "Hz" | "kHz";
	};

	/**
	 * Create a frequency value
	 *
	 * @param value - Numeric frequency value
	 * @param unit - Frequency unit (Hz or kHz)
	 * @returns Frequency instance
	 *
	 * @see https://drafts.csswg.org/css-values-4/#typedef-frequency
	 */
	constructor(value: number, unit: "Hz" | "kHz") {
		this.value = value;
		this.ast = {
			type: "dimension",
			value: value.toString(),
			number: value,
			unit,
		};
	}
}

/**
 * Resolution value
 *
 * @spec https://drafts.csswg.org/css-values-4/#typedef-resolution
 */
export class Resolution {
	public readonly value: number;
	public readonly ast: {
		type: "dimension";
		value: string;
		number: number;
		unit: "dpi" | "dpcm" | "dppx";
	};

	/**
	 * Create a resolution value
	 *
	 * @param value - Numeric resolution value
	 * @param unit - Resolution unit (dpi, dpcm, dppx)
	 * @returns Resolution instance
	 *
	 * @see https://drafts.csswg.org/css-values-4/#typedef-resolution
	 */
	constructor(value: number, unit: "dpi" | "dpcm" | "dppx") {
		this.value = value;
		this.ast = {
			type: "dimension",
			value: value.toString(),
			number: value,
			unit,
		};
	}
}

/**
 * Color value
 *
 * Supports multiple color formats: hex, rgb, hsl, hwb, oklch, oklab
 * @spec https://drafts.csswg.org/css-color-4/#typedef-color
 */
export class Color {
	public readonly value: string;
	public readonly ast: {
		type: "color";
		format: "hex" | "rgb" | "hsl" | "hwb" | "oklch" | "oklab";
		components: unknown[];
		alpha?: number;
	};

	/**
	 * Create a color value
	 *
	 * @param format - Color format
	 * @param components - Color components
	 * @param alpha - Optional alpha value (0-1)
	 * @returns Color instance
	 *
	 * @see https://drafts.csswg.org/css-color-4/#typedef-color
	 */
	constructor(format: "hex" | "rgb" | "hsl" | "hwb" | "oklch" | "oklab", components: unknown[], alpha?: number) {
		const serialized = Color.serializeColor(format, components, alpha);

		this.value = serialized;
		this.ast = {
			type: "color",
			format,
			components,
			alpha,
		};
	}

	/**
	 * Serialize color to CSS string
	 *
	 * @internal Implements color serialization rules from CSS Color Level 4
	 */
	private static serializeColor(format: string, components: unknown[], alpha?: number): string {
		const alphaValue = alpha !== undefined ? alpha : 1;
		const comps = components as number[];

		switch (format) {
			case "hex":
				return `#${String(components[0])}`;
			case "rgb":
				return `rgba(${comps[0]}, ${comps[1]}, ${comps[2]}, ${alphaValue})`;
			case "hsl":
				return `hsla(${comps[0]}, ${comps[1]}%, ${comps[2]}%, ${alphaValue})`;
			case "hwb":
				return `hwb(${comps[0]}, ${comps[1]}%, ${comps[2]}%, ${alphaValue})`;
			case "oklch":
				return `oklch(${comps[0]}%, ${comps[1]}%, ${comps[2]} / ${alphaValue})`;
			case "oklab":
				return `oklab(${comps[0]}% ${comps[1]}% ${comps[2]} / ${alphaValue})`;
		}
		return "";
	}
}

/**
 * Percentage value
 *
 * @spec https://drafts.csswg.org/css-values-4/#typedef-percentage
 */
export class Percentage {
	public readonly value: number;
	public readonly ast: {
		type: "percentage";
		value: string;
		number: number;
	};

	/**
	 * Create a percentage value
	 *
	 * @param value - Numeric percentage value (0-100)
	 * @returns Percentage instance
	 *
	 * @spec https://drafts.csswg.org/css-values-4/#typedef-percentage
	 */
	constructor(value: number) {
		this.value = value;
		this.ast = {
			type: "percentage",
			value: `${value}%`,
			number: value,
		};
	}
}

/**
 * Keyword value
 *
 * Used for reserved keywords like auto, inherit, etc.
 * @spec https://drafts.csswg.org/css-values-4/#common-keywords
 */
export class Keyword {
	public readonly value: string;
	public readonly ast: {
		type: "keyword";
		value: string;
	};

	/**
	 * Create a keyword value
	 *
	 * @param value - Keyword string
	 * @returns Keyword instance
	 *
	 * @spec https://drafts.csswg.org/css-values-4/#common-keywords
	 */
	constructor(value: string) {
		this.value = value;
		this.ast = {
			type: "keyword",
			value,
		};
	}
}

/**
 * Ident value
 *
 * Used for property names, custom identifiers, etc.
 * @spec CSS Syntax §4.2 - Ident tokens
 */
export class Ident {
	public readonly value: string;
	public readonly ast: {
		type: "ident";
		value: string;
	};

	/**
	 * Create an identifier
	 *
	 * @param value - Identifier string
	 * @returns Ident instance
	 * @spec CSS Syntax §4.2 - Ident tokens
	 */
	constructor(value: string) {
		this.value = value;
		this.ast = {
			type: "ident",
			value,
		};
	}
}
