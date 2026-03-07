/**
 * CSSOM CSSStyleRule
 *
 * Full implementation of CSSOM style rule interface
 * @spec CSSOM §6.4.3 - CSSStyleRule interface
 * @spec CSS Syntax §8.1 - Style rules
 *
 * @see https://drafts.csswg.org/cssom-1/#cssstylerule
 * @see https://drafts.csswg.org/css-syntax-3/#qualified-rules
 */
import { CSSRule } from "./css-rule";
import { CSSStyleDeclaration } from "./style-declaration";

/**
 * CSSOM CSSStyleRule
 *
 * Represents a CSS style rule with a selector and declarations
 * @spec CSSOM §6.4.3 - CSSStyleRule interface
 *
 * @see https://drafts.csswg.org/cssom-1/#cssstylerule
 */
export class CSSStyleRule extends CSSRule {
	private _selectorText: string;
	private _style: CSSStyleDeclaration;

	/**
	 * Rule type constant
	 *
	 * @see https://drafts.csswg.org/cssom-1/#cssstylerule-type
	 */
	static readonly TYPE = "style";

	/**
	 * Create CSSStyleRule
	 *
	 * @param selectorText - CSS selector text
	 * @param options - Optional style sheet options
	 *
	 * @see https://drafts.csswg.org/css-syntax-3/#style-rules
	 */
	constructor(selectorText: string, options?: { cssText?: string }) {
		super();
		this._selectorText = selectorText;
		this._style = new CSSStyleDeclaration();

		if (options?.cssText) {
			this._style.cssText = options.cssText;
		}
	}

	/**
	 * Get selector text
	 *
	 * @returns CSS selector string
	 *
	 * @implements CSSOM §6.4.3 - selectorText
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylerule-selectortext
	 */
	get selectorText(): string {
		return this._selectorText;
	}

	/**
	 * Set selector text
	 *
	 * @param value - New selector text
	 *
	 * @implements CSSOM §6.4.3 - selectorText
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylerule-selectortext
	 */
	set selectorText(value: string) {
		this._selectorText = value;
	}

	/**
	 * Get style declaration
	 *
	 * @returns CSSStyleDeclaration instance
	 *
	 * @implements CSSOM §6.4.3 - style
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylerule-style
	 */
	get style(): CSSStyleDeclaration {
		return this._style;
	}

	/**
	 * Get rule as CSS string
	 *
	 * @returns CSS string representation
	 *
	 * @implements CSSOM §6.4.3 - cssText
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylerule-csstext
	 */
	get cssText(): string {
		const styleText = this._style.cssText;
		return `${this._selectorText} { ${styleText} }`;
	}

	/**
	 * Set rule from CSS string
	 *
	 * @param cssText - CSS string to parse
	 *
	 * @implements CSSOM §6.4.3 - cssText
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylerule-csstext
	 */
	set cssText(cssText: string) {
		// Simple parsing: "selector { declarations }"
		const braceStart = cssText.indexOf("{");
		const braceEnd = cssText.lastIndexOf("}");

		if (braceStart !== -1 && braceEnd !== -1) {
			const selector = cssText.slice(0, braceStart).trim();
			const styleText = cssText.slice(braceStart + 1, braceEnd).trim();

			this._selectorText = selector;
			this._style.cssText = styleText;
		}
	}

	/**
	 * Get rule type
	 *
	 * @returns "style"
	 *
	 * @implements CSSOM §6.4.3 - type
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylerule-type
	 */
	get type(): string {
		return CSSStyleRule.TYPE;
	}

	/**
	 * Get property value from style
	 *
	 * @param property - CSS property name
	 * @returns Property value or null if not set
	 *
	 * @implements CSSOM §6.4.3 - getPropertyValue()
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylerule-getpropertyvalue
	 */
	getPropertyValue(property: string): string | null {
		return this._style.getPropertyValue(property);
	}

	/**
	 * Get property priority
	 *
	 * @param property - CSS property name
	 * @returns "important" if property has !important flag, otherwise ""
	 *
	 * @implements CSSOM §6.4.3 - getPropertyPriority()
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylerule-getpropertypriority
	 */
	getPropertyPriority(property: string): "important" | "" {
		return this._style.getPropertyPriority(property);
	}

	/**
	 * Set property value
	 *
	 * @param property - CSS property name
	 * @param value - CSS value to set
	 * @param priority - Optional priority ("" or "important")
	 *
	 * @implements CSSOM §6.4.3 - setProperty()
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylerule-setproperty
	 */
	setProperty(property: string, value: string, priority: "" | "important" = ""): void {
		this._style.setProperty(property, value, priority);
	}

	/**
	 * Remove property
	 *
	 * @param property - CSS property name to remove
	 * @returns Previous property value or null
	 *
	 * @implements CSSOM §6.4.3 - removeProperty()
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylerule-removeproperty
	 */
	removeProperty(property: string): string | null {
		return this._style.removeProperty(property);
	}
}
