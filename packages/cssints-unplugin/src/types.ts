/**
 * Type definitions for @cssints/unplugin
 */

import type { Targets } from "lightningcss";

export interface CssintsOptions {
	/** CSS output options */
	css?: {
		/** Minify CSS output (default: true in prod, false in dev) */
		minify?: boolean;
		/** Output CSS file name (default: "styles.css") */
		output?: string;
		/** Browser targets for autoprefixing */
		targets?: Targets;
	};
	/** Class naming options */
	naming?: {
		/** Include component name prefix in dev (default: true) */
		devPrefix?: boolean;
		/** Hash length for class names (default: 7) */
		hashLength?: number;
	};
}

export interface MacroContext {
	/** Source file ID */
	id: string;
	/** Current code */
	code: string;
	/** Whether in development mode */
	isDev: boolean;
	/** Generated CSS map */
	cssMap: Map<string, string>;
}

export interface TransformResult {
	/** Transformed code */
	code: string;
	/** Generated CSS */
	css: string;
	/** Source map (optional) */
	map?: object;
}
