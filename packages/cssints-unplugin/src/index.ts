/**
 * @cssints/unplugin
 *
 * Vite plugin for CSS-in-TS that works alongside unplugin-parcel-macros
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { cssints } from "@cssints/unplugin/vite";
 * import macros from "unplugin-parcel-macros/vite";
 *
 * export default {
 *   plugins: [
 *     macros(),  // Process macro imports
 *     cssints(), // Generate and emit CSS
 *   ],
 * };
 * ```
 */

// Vite plugin
export { cssints } from "./vite.js";
export type { CssintsOptions } from "./types.js";

// Virtual CSS utilities
export {
  storeCss,
  getCss,
  clearAllCss,
  getAllCss,
} from "./virtual-css.js";

// Error types
export { PostProcessError, VisitorError } from "./errors.js";

// Visitors
export {
  createAtomicVisitor,
  resetAtomicRegistry,
} from "./visitors/atomic-visitor.js";
export {
  createCalcVisitor,
  resetCalcRegistry,
} from "./visitors/calc-visitor.js";
export {
  createLayerVisitor,
  type LayerOptions,
} from "./visitors/layer-visitor.js";
export {
  postprocessCSS,
  postprocessCSSSync,
  type PostProcessOptions,
  type PostProcessResult,
} from "./visitors/index.js";

// CSS Generation
export {
  generateVariantCSS,
  generateVariantCSSSync,
  generateSlotVariantCSS,
  generateSlotVariantCSSSync,
  type GeneratedCSS,
  type ClassNameMap,
  type CSSGeneratorOptions,
} from "./css-generator.js";

// Hash utilities
export {
  generateHash,
  generateClassName,
  getOrCreateHash,
  resetHashRegistry,
  type HashOptions,
} from "./hash.js";

// Layer utilities
export {
  getLayerForDepth,
  determineLayer,
  wrapInLayer,
  generateLayerDeclaration,
  organizeByLayer,
  type LayerConfig,
  type LayerInfo,
} from "./layers.js";

// CSS Parsing
export {
  parseDeclarations,
  expandShorthand,
  isValidCSSValue,
  type CSSDeclaration,
} from "./css-parser.js";

// Transform utilities
export {
  transformCvCall,
  transformScvCall,
  transformFile,
  transformFileSync,
  type TransformContext,
  type TransformOptions,
} from "./transform/index.js";
