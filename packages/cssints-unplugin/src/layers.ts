/**
 * Cascade layer management (StyleX-style)
 *
 * Layers control CSS specificity:
 * - _.a: Base styles (lowest priority)
 * - _.b: :hover, :focus states
 * - _.c: @media queries
 * - _.d, _.e, etc.: Nested conditions
 *
 * @example
 * @layer _.a {
 *   .Button_a1b2c3 { padding: 1rem; }
 * }
 * @layer _.b {
 *   .Button_a1b2c3:hover { background: blue; }
 * }
 * @layer _.c {
 *   @media (min-width: 768px) {
 *     .Button_a1b2c3 { padding: 2rem; }
 *   }
 * }
 */

export interface LayerConfig {
  /** Base layer name (default: _.a) */
  base?: string;
  /** Starting ASCII code for layer suffix (default: 97 = 'a') */
  startCode?: number;
}

/**
 * Get layer name for a given depth
 *
 * @param depth - Condition depth (0 = base, 1 = hover/focus, 2 = media, etc.)
 * @returns Layer name (_.a, _.b, _.c, etc.)
 *
 * @example
 * getLayerForDepth(0) // "_.a"
 * getLayerForDepth(1) // "_.b"
 * getLayerForDepth(2) // "_.c"
 */
export function getLayerForDepth(depth: number): string {
  // ASCII 97 = 'a', 98 = 'b', etc.
  const char = String.fromCharCode(97 + depth);
  return `_.${char}`;
}

/**
 * Layer information for a CSS rule
 */
export interface LayerInfo {
  /** Layer name (_.a, _.b, etc.) */
  name: string;
  /** Depth level */
  depth: number;
  /** Whether this is a pseudo-class (:hover, :focus) */
  isPseudo: boolean;
  /** Whether this is a media query */
  isMedia: boolean;
}

/**
 * Determine layer information from CSS content
 *
 * @param css - CSS rule content
 * @returns Layer information
 */
export function determineLayer(css: string): LayerInfo {
  const trimmed = css.trim();

  // Check for media queries (depth 2+)
  if (trimmed.startsWith("@media")) {
    return {
      name: getLayerForDepth(2),
      depth: 2,
      isPseudo: false,
      isMedia: true,
    };
  }

  // Check for pseudo-classes (depth 1)
  // Matches: :hover, :focus, :active, :disabled, etc.
  if (/:([a-z-]+)/.test(trimmed)) {
    return {
      name: getLayerForDepth(1),
      depth: 1,
      isPseudo: true,
      isMedia: false,
    };
  }

  // Base styles (depth 0)
  return {
    name: getLayerForDepth(0),
    depth: 0,
    isPseudo: false,
    isMedia: false,
  };
}

/**
 * Wrap CSS rules in a layer
 *
 * @param css - CSS rules
 * @param layerName - Layer name (_.a, _.b, etc.)
 * @returns Layered CSS
 */
export function wrapInLayer(css: string, layerName: string): string {
  if (!css.trim()) return "";

  return `@layer ${layerName} {\n${css}\n}`;
}

/**
 * Generate layer declaration
 *
 * @param maxDepth - Maximum depth needed
 * @returns @layer declaration string
 *
 * @example
 * generateLayerDeclaration(2)
 * // "@layer _.a, _.b, _.c;"
 */
export function generateLayerDeclaration(maxDepth: number): string {
  const layers: string[] = [];
  for (let i = 0; i <= maxDepth; i++) {
    layers.push(getLayerForDepth(i));
  }
  return `@layer ${layers.join(", ")};`;
}

/**
 * Organize CSS rules by layer
 *
 * @param rules - Array of CSS rules with their content
 * @returns Object with layer names as keys and CSS content as values
 */
export function organizeByLayer(rules: Array<{ content: string; depth: number }>): Record<string, string> {
  const organized: Record<string, string[]> = {};

  for (const rule of rules) {
    const layerName = getLayerForDepth(rule.depth);
    if (!organized[layerName]) {
      organized[layerName] = [];
    }
    organized[layerName].push(rule.content);
  }

  // Join rules within each layer
  const result: Record<string, string> = {};
  for (const [layer, rules] of Object.entries(organized)) {
    result[layer] = rules.join("\n");
  }

  return result;
}
