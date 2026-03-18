/**
 * @cssints/variants
 *
 * Runtime functions for CSS-in-TS variant system
 *
 * These are lightweight runtime functions (~1KB) that compose
 * pre-computed class names at runtime.
 */

// Runtime functions (used after build-time transformation)
export {
  _cv,
  _scv,
  cx,
  cn,
  type CvRuntimeConfig,
  type ScvRuntimeConfig,
  type ClassValue,
  type ClassDictionary,
  type ClassArray,
} from "./runtime.js";
