// CSS-in-TS Compiler - Main Entry Point

// Core compiler API
export { style, createStyle, cx, generateCSS, getRegisteredClasses, clearRegistry, setFileScope } from "./compiler";

// Utility functions
export { createSizes, createMedia, defaultMediaQueries } from "./api";

// cssints compile-time utilities (exported before utilities to allow overwriting)
export { setScale, getScale, pxToRem, remToPx } from "./cssints";

// Re-export all utilities (may overwrite some cssints exports)
export * from "./utilities";

// Design tokens
export {
	// Types
	type DesignToken,
	type DesignTokenGroup,
	type Theme,

	// Token types
	TokenType,

	// Default tokens
	defaultTokens,

	// Token functions
	resolveToken,
	createTheme,
	getCSSVariables,
	token,
	loadTokensFromFile,
	saveTokensToFile,
} from "./tokens";

// Theme functions
export { type ThemeVars, createGlobalTheme, globalStyle } from "./theme";

// Types
export * from "./types";

// Vite plugins
export { cssTSPlugin } from "./vite-plugin";
export type { CSSTSPluginOptions } from "./vite-plugin";

// Simple Vite plugin (regex-based, no native dependencies)
export { cssintsPlugin } from "./simple-plugin";

// CSSints integration
export {
	// Registry
	clearCSSRegistry,
	getCSSRegistry,
	// Registration
	registerClass,
	registerMultiPropertyClass,
	registerCSSProperty,
	registerToken,
	// Transform
	transformPropertyCall,
	transformFunctionCall,
	transformComposableCall,
	// Generation
	generateCSS as generateCSSintsCSS,
	generateHash,
	generateClassName,
	// Stats
	getStats,
} from "./integration";

// Note: Oxc plugin is exported separately via ./oxc entry point to avoid
// bundling native dependencies in the main entry
