// CSS-in-TS Compiler - Main Entry Point

// Core compiler API
export {
  style,
  createStyle,
  cx,
  generateCSS,
  getRegisteredClasses,
  clearRegistry,
  setFileScope,
} from './compiler';

// Utility functions
export { createSizes, createMedia, defaultMediaQueries } from './api';

// Re-export all utilities
export * from './utilities';

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
} from './tokens';

// Theme functions
export {
  type ThemeVars,
  createGlobalTheme,
  globalStyle,
} from './theme';

// Types
export * from './types';

// Vite plugins
export { cssTSPlugin } from './vite-plugin';
export type { CSSTSPluginOptions } from './vite-plugin';

// Oxc Vite plugin (new AST-based implementation)
export { cssTSOxcPlugin, type OxcPluginOptions } from './oxc-plugin';
