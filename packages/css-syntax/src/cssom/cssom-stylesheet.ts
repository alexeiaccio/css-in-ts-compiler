/**
 * CSSOM CSSStyleSheet
 *
 * Full implementation of CSSOM stylesheet interface
 * @spec CSSOM §6.1.2 - CSSStyleSheet interface
 * @spec CSS Syntax §8 - CSS stylesheets
 *
 * @see https://drafts.csswg.org/cssom-1/#cssstylesheet
 *drafts.csswg @see https://.org/css-syntax-3/#parse-stylesheet
 */
import { CSSRule } from "./css-rule";
import { CSSStyleRule } from "./css-style-rule";

/**
 * CSSOM CSSStyleSheet
 *
 * Represents a complete CSS stylesheet
 * @spec CSSOM §6.1.2 - CSSStyleSheet interface
 *
 * @see https://drafts.csswg.org/cssom-1/#cssstylesheet
 */
export class CSSStyleSheet {
	private _cssRules: CSSRule[] = [];
	private _disabled: boolean = false;
	private _media: string | null = null;
	private _href: string | null = null;
	private _ownerNode: any = null;
	private _parentStyleSheet: CSSStyleSheet | null = null;
	private _title: string = "";
	private _alternate: boolean = false;

	/**
	 * Create CSSStyleSheet
	 *
	 * @param options - Optional stylesheet options
	 *
	 * @implements https://drafts.csswg.org/cssom-1/#create-a-constructed-cssstylesheet
	 */
	constructor(options?: { media?: string; disabled?: boolean; baseURI?: string; title?: string }) {
		if (options?.media) {
			this._media = options.media;
		}
		if (options?.disabled) {
			this._disabled = true;
		}
		if (options?.baseURI) {
			this._href = options.baseURI;
		}
		if (options?.title) {
			this._title = options.title;
		}
	}

	/**
	 * Get all CSS rules
	 *
	 * @returns Array of CSSRule objects
	 *
	 * @implements CSSOM §6.1.2 - cssRules
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-cssrules
	 */
	get cssRules(): CSSRule[] {
		return [...this._cssRules];
	}

	/**
	 * Insert rule at index
	 *
	 * @param rule - CSS rule string to insert
	 * @param index - Optional index to insert at (default: end)
	 * @returns Index where rule was inserted
	 *
	 * @implements CSSOM §6.1.2 - insertRule()
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-insertrule
	 */
	insertRule(rule: string, index?: number): number {
		const insertIndex = index ?? this._cssRules.length;

		// Parse rule string into CSSRule
		const parsedRule = this.parseRule(rule);
		if (parsedRule) {
			this._cssRules.splice(insertIndex, 0, parsedRule);
		}

		return insertIndex;
	}

	/**
	 * Delete rule at index
	 *
	 * @param index - Index of rule to delete
	 *
	 * @implements CSSOM §6.1.2 - deleteRule()
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-deleterule
	 */
	deleteRule(index: number): void {
		const safeIndex = index ?? this._cssRules.length;
		if (index >= 0 && index < this._cssRules.length) {
			this._cssRules.splice(index, 1);
		}
	}

	/**
	 * Add a rule
	 *
	 * @param selector - CSS selector
	 * @param style - CSS style string
	 * @param index - Optional index to insert at
	 * @returns Index where rule was inserted
	 *
	 * @implements CSSOM §6.1.2 - addRule() (legacy)
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-addrule
	 */
	addRule(selector: string, style: string, index?: number): number {
		const rule = `${selector} { ${style} }`;
		return this.insertRule(rule, index);
	}

	/**
	 * Remove a rule by selector
	 *
	 * @param selector - CSS selector to remove
	 * @returns Number of rules removed
	 *
	 * @implements CSSOM §6.1.2 - removeRule() (legacy)
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-removerule
	 */
	removeRule(selector: string): number {
		const toRemove: number[] = [];

		this._cssRules.forEach((rule, index) => {
			if (rule instanceof CSSStyleRule && rule.selectorText === selector) {
				toRemove.push(index);
			}
		});

		// Remove in reverse order to maintain indices
		for (let i = toRemove.length - 1; i >= 0; i--) {
			const idx = toRemove[i];
			if (idx !== undefined) {
				this._cssRules.splice(idx, 1);
			}
		}

		return toRemove.length;
	}

	/**
	 * Get disabled state
	 *
	 * @returns True if stylesheet is disabled
	 *
	 * @implements CSSOM §6.1.2 - disabled
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-disabled
	 */
	get disabled(): boolean {
		return this._disabled;
	}

	/**
	 * Set disabled state
	 *
	 * @param value - Disabled state
	 *
	 * @implements CSSOM §6.1.2 - disabled
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-disabled
	 */
	set disabled(value: boolean) {
		this._disabled = value;
	}

	/**
	 * Get media query
	 *
	 * @returns Media query string or null
	 *
	 * @implements CSSOM §6.1.2 - media
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-media
	 */
	get media(): string | null {
		return this._media;
	}

	/**
	 * Set media query
	 *
	 * @param value - Media query string
	 *
	 * @implements CSSOM §6.1.2 - media
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-media
	 */
	set media(value: string) {
		this._media = value;
	}

	/**
	 * Get stylesheet href
	 *
	 * @returns URL or null
	 *
	 * @implements CSSOM §6.1.2 - href
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-href
	 */
	get href(): string | null {
		return this._href;
	}

	/**
	 * Get owner node
	 *
	 * @returns Owner node or null
	 *
	 * @implements CSSOM §6.1.2 - ownerNode
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-ownernode
	 */
	get ownerNode(): any {
		return this._ownerNode;
	}

	/**
	 * Set owner node
	 *
	 * @param node - Owner node
	 *
	 * @implements CSSOM §6.1.2 - ownerNode
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-ownernode
	 */
	set ownerNode(node: any) {
		this._ownerNode = node;
	}

	/**
	 * Get parent stylesheet
	 *
	 * @returns Parent stylesheet or null
	 *
	 * @implements CSSOM §6.1.2 - parentStyleSheet
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-parentsylesheet
	 */
	get parentStyleSheet(): CSSStyleSheet | null {
		return this._parentStyleSheet;
	}

	/**
	 * Get stylesheet title
	 *
	 * @returns Title string
	 *
	 * @implements CSSOM §6.1.2 - title
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-title
	 */
	get title(): string {
		return this._title;
	}

	/**
	 * Set stylesheet title
	 *
	 * @param value - Title string
	 *
	 * @implements CSSOM §6.1.2 - title
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-title
	 */
	set title(value: string) {
		this._title = value;
	}

	/**
	 * Get alternate flag
	 *
	 * @returns True if alternate stylesheet
	 *
	 * @implements CSSOM §6.1.2 - alternate flag
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-disabled
	 */
	get alternate(): boolean {
		return this._alternate;
	}

	/**
	 * Set alternate flag
	 *
	 * @param value - Alternate state
	 *
	 * @implements CSSOM §6.1.2 - alternate flag
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-disabled
	 */
	set alternate(value: boolean) {
		this._alternate = value;
	}

	/**
	 * Get stylesheet type
	 *
	 * @returns Always "text/css"
	 *
	 * @implements CSSOM §6.1.2 - type
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-type
	 */
	get type(): string {
		return "text/css";
	}

	/**
	 * Get rule count
	 *
	 * @returns Number of rules
	 *
	 * @implements CSSOM §6.1.2 - cssRules.length
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-cssrules
	 */
	get length(): number {
		return this._cssRules.length;
	}

	/**
	 * Get rule at index
	 *
	 * @param index - Rule index
	 * @returns CSSRule at index
	 *
	 * @implements CSSOM §6.1.2 - item()
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-item
	 */
	item(index: number): CSSRule | null {
		return this._cssRules[index] ?? null;
	}

	/**
	 * Get stylesheet as CSS string
	 *
	 * @returns CSS string representation
	 *
	 * @implements CSSOM §6.1.2 - cssRules.cssText
	 * @see https://drafts.csswg.org/cssom-1/#dom-cssstylesheet-cssrules
	 */
	get cssText(): string {
		return this._cssRules
			.map((rule) => (rule as any).cssText ?? "")
			.filter(Boolean)
			.join("\n\n");
	}

	/**
	 * Parse rule string into CSSRule
	 *
	 * @param rule - CSS rule string
	 * @returns CSSRule or null if invalid
	 *
	 * @see https://drafts.csswg.org/css-syntax-3/#parse-rule
	 */
	private parseRule(rule: string): CSSRule | null {
		const trimmed = rule.trim();

		// Check for @-rules
		if (trimmed.startsWith("@")) {
			// Handle @import, @media, @keyframes, etc.
			// For now, just return null for unknown @-rules
			return null;
		}

		// Parse as style rule: "selector { declarations }"
		const braceStart = trimmed.indexOf("{");
		const braceEnd = trimmed.lastIndexOf("}");

		if (braceStart === -1 || braceEnd === -1) {
			return null;
		}

		const selector = trimmed.slice(0, braceStart).trim();
		const styleText = trimmed.slice(braceStart + 1, braceEnd).trim();

		if (!selector || !styleText) {
			return null;
		}

		return new CSSStyleRule(selector, { cssText: styleText });
	}
}
