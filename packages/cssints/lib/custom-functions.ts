/**
 * Custom CSS Functions
 *
 * This file allows you to extend the auto-generated typed functions.
 * Add custom functions here that are not covered by WebRef or need special handling.
 *
 * Usage:
 * 1. Import types from ./typed.ts
 * 2. Use createTyped to create typed functions
 * 3. Export your custom functions
 *
 * Example:
 * ```ts
 * import { createTyped, Color, Percentage } from "./typed";
 *
 * export type CustomColorMix = Typed<string, "CustomColorMix">;
 *
 * export const customColorMix = createTyped<
 *   (color1: Color, color2: Color, amount: Percentage) => CustomColorMix,
 *   "CustomColorMixFn"
 * >((color1, color2, amount) => 
 *   `color-mix(in srgb, ${color1} ${amount}, ${color2})`
 * );
 * ```
 */

import { createTyped, type Typed } from "./typed";

// Re-export types for convenience
export { createTyped, type Typed };

// ============================================================================
// Custom Functions
// ============================================================================

// Add your custom CSS functions here
// Example: vendor-prefixed functions, experimental features, project-specific utilities
