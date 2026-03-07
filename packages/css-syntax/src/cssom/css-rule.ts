/**
 * CSSOM CSSRule interface
 *
 * Base interface for all CSS rules
 * @spec CSSOM §6.4 - CSSRule interface
 *
 * @see https://drafts.csswg.org/cssom-1/#cssrule
 */

/**
 * Base class for all CSS rules
 *
 * @spec CSSOM §6.4 - CSSRule interface
 *
 * @see https://drafts.csswg.org/cssom-1/#cssrule
 */
export abstract class CSSRule {
	private _parentRule: CSSRule | null = null;
	private _parentStyleSheet: any = null;

	/**
	 * Get parent CSS rule
	 *
	 * @returns Parent CSS rule or null
	 *
	 * @implements CSSOM §6.4 - parentRule property
	 * @see https://drafts.csswg.org/cssom-1/#cssrule-parent
	 */
	get parentRule(): CSSRule | null {
		return this._parentRule;
	}

	/**
	 * Set parent CSS rule
	 *
	 * @param rule - Parent CSS rule
	 */
	set parentRule(rule: CSSRule | null) {
		this._parentRule = rule;
	}

	/**
	 * Get parent style sheet
	 *
	 * @returns Parent style sheet or null
	 *
	 * @implements CSSOM §6.4 - parentStyleSheet property
	 * @see https://drafts.csswg.org/cssom-1/#cssrule-parent
	 */
	get parentStyleSheet(): any {
		return this._parentStyleSheet;
	}

	/**
	 * Set parent style sheet
	 *
	 * @param sheet - Parent style sheet
	 */
	set parentStyleSheet(sheet: any) {
		this._parentStyleSheet = sheet;
	}
}
