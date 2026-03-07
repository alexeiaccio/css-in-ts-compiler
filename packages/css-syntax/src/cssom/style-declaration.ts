/**
 * CSSOM CSSStyleDeclaration
 *
 * Full implementation of CSSOM CSSStyleDeclaration interface
 * @spec CSSOM §6.5 - CSS declarations
 * @spec CSS Syntax §8.1 - Declarations
 *
 * @see https://drafts.csswg.org/cssom-1/#cssstyledeclaration
 * @see https://drafts.csswg.org/css-syntax-3/#consume-declaration
 */

/**
 * CSSOM CSSStyleDeclaration
 *
 * Represents the style declaration collection for a rule
 * @spec CSSOM §6.5 - CSSStyleDeclaration interface
 *
 * @see https://drafts.csswg.org/cssom-1/#cssstyledeclaration
 */
export class CSSStyleDeclaration {
	private _properties: Record<string, string> = {};
	private _important: Set<string> = new Set();
	private _parentRule: any = null;

	/**
	 * Get parent CSS rule
	 *
	 * @returns Parent CSS rule or null
	 *
	 * @implements CSSOM §6.5 - parentRule property
	 * @see https://drafts.csswg.org/cssom-1/#cssstyledeclaration-parent
	 */
	get parentRule(): any {
		return this._parentRule;
	}

	/**
	 * Set parent CSS rule
	 *
	 * @param rule - Parent CSS rule
	 */
	set parentRule(rule: any) {
		this._parentRule = rule;
	}

	/**
	 * Get property value
	 *
	 * @param property - CSS property name
	 * @returns Property value or null if not set
	 *
	 * @implements CSSOM §6.4.3 - getPropertyValue()
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstyledeclaration-getpropertyvalue
	 */
	getPropertyValue(property: string): string | null {
		return this._properties[property] ?? null;
	}

	/**
	 * Get property priority
	 *
	 * @param property - CSS property name
	 * @returns "important" if property has !important flag, otherwise ""
	 *
	 * @implements CSSOM §6.4.3 - getPropertyPriority()
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstyledeclaration-getpropertypriority
	 */
	getPropertyPriority(property: string): "important" | "" {
		return this._important.has(property) ? "important" : "";
	}

	/**
	 * Set property value
	 *
	 * @param property - CSS property name
	 * @param value - CSS value to set
	 * @param priority - Optional priority ("" or "important")
	 *
	 * @implements CSSOM §6.4.3 - setProperty()
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstyledeclaration-setproperty
	 */
	setProperty(property: string, value: string, priority: "" | "important" = ""): void {
		this._properties[property] = value;

		if (priority === "important") {
			this._important.add(property);
		} else {
			this._important.delete(property);
		}
	}

	/**
	 * Remove property
	 *
	 * @param property - CSS property name to remove
	 * @returns Previous property value or null
	 *
	 * @implements CSSOM §6.4.3 - removeProperty()
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstyledeclaration-removeproperty
	 */
	removeProperty(property: string): string | null {
		const previousValue = this._properties[property] ?? null;
		delete this._properties[property];
		this._important.delete(property);
		return previousValue;
	}

	/**
	 * Get all property names
	 *
	 * @returns Array of property names
	 *
	 * @implements CSSOM §6.4.3 - length and item()
	 */
	get properties(): string[] {
		return Object.keys(this._properties);
	}

	/**
	 * Get style rule as CSS string
	 *
	 * @returns CSS string representation
	 *
	 * @implements CSSOM §6.4.3 - cssText
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstyledeclaration-csstext
	 */
	get cssText(): string {
		const decls = this.properties
			.map((prop) => {
				const value = this._properties[prop];
				const priority = this.getPropertyPriority(prop);
				return priority ? `${prop}: ${value} ${priority};` : `${prop}: ${value};`;
			})
			.join(" ");

		return decls;
	}

	/**
	 * Set style rule from CSS string
	 *
	 * @param cssText - CSS string to parse
	 *
	 * @implements CSSOM §6.4.3 - cssText
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstyledeclaration-csstext
	 */
	set cssText(cssText: string) {
		this._properties = {};
		this._important.clear();

		// Simple parsing of "property: value;" declarations
		const decls = cssText.split(";");
		for (const decl of decls) {
			const trimmed = decl.trim();
			if (!trimmed) continue;

			const colonIndex = trimmed.indexOf(":");
			if (colonIndex === -1) continue;

			const property = trimmed.slice(0, colonIndex).trim();
			const rest = trimmed.slice(colonIndex + 1).trim();

			// Check for !important
			let value: string = rest;
			const priority: "" | "important" = rest.endsWith(" !important") ? "important" : "";
			if (priority) {
				value = rest.slice(0, -10).trim();
			}

			this.setProperty(property, value, priority);
		}
	}

	/**
	 * Get declaration count
	 *
	 * @returns Number of declarations
	 *
	 * @implements CSSOM §6.4.3 - length
	 */
	get length(): number {
		return this.properties.length;
	}

	/**
	 * Get property at index
	 *
	 * @param index - Index of property
	 * @returns Property name
	 *
	 * @implements CSSOM §6.4.3 - item()
	 */
	item(index: number): string {
		const prop = this.properties[index];
		return prop ?? "";
	}
}
