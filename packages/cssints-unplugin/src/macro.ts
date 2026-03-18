/**
 * Macro utilities for cssints
 *
 * Helper functions to detect and process macro imports.
 * The actual macro transformation is handled by unplugin-parcel-macros.
 */

/**
 * Check if code contains cssints macro import
 * Matches: import * as css from "cssints" with { type: "macro" }
 */
export function hasCssintsMacro(code: string): boolean {
  return (
    code.includes('from "cssints" with { type: "macro" }') ||
    code.includes("from 'cssints' with { type: 'macro' }")
  );
}

/**
 * Extract macro import names from code
 *
 * Returns the local name used for the cssints import
 * e.g., `import * as css from "cssints" with { type: "macro" }` returns "css"
 */
export function extractMacroImportName(code: string): string | null {
  // Match: import * as NAME from "cssints" with { type: "macro" }
  const match = code.match(
    /import\s*\*\s*as\s+(\w+)\s+from\s+["']cssints["']\s+with\s*{\s*type:\s*["']macro["']\s*}/
  );
  return match?.[1] ?? null;
}
