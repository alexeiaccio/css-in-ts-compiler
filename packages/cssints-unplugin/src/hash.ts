/**
 * Hash generation utilities for CSS class names
 *
 * - Development: ComponentName_hash (e.g., Button_a1b2c3)
 * - Production: hash only (e.g., _a1b2c3)
 */

export interface HashOptions {
  /** Include component name prefix (dev mode) */
  devPrefix: boolean;
  /** Hash length */
  length: number;
}

/**
 * Generate a consistent hash from content
 */
export function generateHash(content: string, length: number = 7): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Convert to base36 and take first 'length' characters
  const base36 = Math.abs(hash).toString(36);
  return "_" + base36.padStart(length, "0").slice(0, length);
}

/**
 * Generate a class name from component and content
 *
 * @example
 * // Development:
 * generateClassName("Button", "padding:1rem", { devPrefix: true, length: 7 })
 * // → "Button_a1b2c3d"
 *
 * // Production:
 * generateClassName("Button", "padding:1rem", { devPrefix: false, length: 7 })
 * // → "_a1b2c3d"
 */
export function generateClassName(
  componentName: string,
  content: string,
  options: HashOptions
): string {
  const hash = generateHash(content, options.length);

  if (options.devPrefix) {
    return `${componentName}${hash}`;
  }

  return hash;
}

/**
 * Reset hash registry (useful for testing)
 */
export const hashRegistry = new Map<string, string>();

export function resetHashRegistry(): void {
  hashRegistry.clear();
}

/**
 * Get or create a hash for content
 * Ensures consistent hashing across multiple calls
 */
export function getOrCreateHash(
  componentName: string,
  content: string,
  options: HashOptions
): string {
  const key = `${componentName}:${content}`;

  if (hashRegistry.has(key)) {
    return hashRegistry.get(key)!;
  }

  const className = generateClassName(componentName, content, options);
  hashRegistry.set(key, className);
  return className;
}
