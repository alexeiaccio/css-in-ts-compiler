/**
 * Variant macro functions for CSS-in-TS
 *
 * These functions run at build time when imported with { type: "macro" }
 * to generate atomic CSS and return optimized runtime code.
 *
 * @example
 * ```ts
 * import * as css from "cssints" with { type: "macro" };
 *
 * const button = css.cv({
 *   base: "padding: 1rem; background: blue",
 *   variants: {
 *     size: { sm: "padding: 0.5rem", lg: "padding: 2rem" }
 *   }
 * });
 * ```
 */

import { storeCss } from "@cssints/unplugin";

/**
 * Variant configuration for cv() macro
 */
export interface VariantConfig {
  /** Base styles applied to all variants */
  base?: string;
  /** Variant definitions */
  variants?: Record<string, Record<string, string>>;
  /** Compound variants for complex conditions */
  compoundVariants?: Array<
    Record<string, string | string[]> & {
      className?: string;
      style?: string;
    }
  >;
  /** Default variant values */
  defaultVariants?: Record<string, string>;
}

/**
 * Slot variant configuration for scv() macro
 */
export interface SlotVariantConfig {
  /** Slot names (e.g., ['root', 'header', 'content']) */
  slots: string[];
  /** Base styles per slot */
  base?: Record<string, string>;
  /** Variant definitions per slot */
  variants?: Record<string, Record<string, Record<string, string>>>;
  /** Default variant values */
  defaultVariants?: Record<string, string>;
}

/**
 * Style variant configuration for sv() macro
 */
export interface StyleVariantConfig {
  /** Base inline styles */
  base?: Record<string, string>;
  /** Variant style definitions */
  variants?: Record<string, Record<string, Record<string, string>>>;
  /** Default variant values */
  defaultVariants?: Record<string, string>;
}

/**
 * Class value types for cx() utility
 */
export type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | ClassArray
  | ClassDictionary;

export interface ClassDictionary {
  [id: string]: boolean | undefined | null;
}

export interface ClassArray extends Array<ClassValue> {}

/**
 * Generate a consistent hash from content
 */
function generateHash(content: string, length: number = 7): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36).substring(0, length);
}

/**
 * Parse CSS properties from style string
 * e.g., "padding: 1rem; background: blue" → [{prop: "padding", value: "1rem"}, ...]
 */
function parseStyles(styleStr: string): Array<{ property: string; value: string }> {
  const styles: Array<{ property: string; value: string }> = [];
  const declarations = styleStr.split(";").filter((s) => s.trim());

  for (const decl of declarations) {
    const [prop, ...valueParts] = decl.split(":");
    if (prop && valueParts.length > 0) {
      styles.push({
        property: prop.trim(),
        value: valueParts.join(":").trim(),
      });
    }
  }

  return styles;
}

/**
 * Generate atomic CSS from styles
 */
function generateAtomicCSS(
  componentName: string,
  styles: Array<{ property: string; value: string }>,
  options: { devPrefix: boolean; hashLength: number }
): { className: string; css: string } {
  const content = styles.map((s) => `${s.property}:${s.value}`).join(";");
  const hash = generateHash(content, options.hashLength);
  const className = options.devPrefix ? `${componentName}_${hash}` : `_${hash}`;

  const cssRules = styles
    .map((style) => `.${className} { ${style.property}: ${style.value}; }`)
    .join("\n");

  return { className, css: cssRules };
}

/**
 * Class Variants - Define component variants with atomic CSS
 *
 * This macro runs at build time to generate CSS and returns an optimized
 * runtime function for class name composition.
 *
 * @example
 * ```ts
 * import * as css from "cssints" with { type: "macro" };
 *
 * const button = css.cv({
 *   base: "padding: 1rem 2rem; background: #3b82f6; color: white",
 *   variants: {
 *     size: {
 *       sm: "padding: 0.5rem 1rem; font-size: 0.875rem",
 *       lg: "padding: 1rem 2rem; font-size: 1.125rem"
 *     },
 *     variant: {
 *       primary: "background: #3b82f6",
 *       secondary: "background: #6b7280"
 *     }
 *   },
 *   defaultVariants: {
 *     size: "md",
 *     variant: "primary"
 *   }
 * });
 *
 * // Usage
 * button({ size: "lg", variant: "primary" }) // Returns class names
 * ```
 */
export function cv(config: VariantConfig): (props?: Record<string, string>) => string {
  const options = { devPrefix: true, hashLength: 7 };
  const componentName = "Component"; // TODO: Extract from call site

  // Generate base class
  const baseStyles = config.base ? parseStyles(config.base) : [];
  const { className: baseClass, css: baseCss } = generateAtomicCSS(
    componentName,
    baseStyles,
    options
  );

  // Store CSS for this component
  storeCss(componentName, baseCss);

  // Generate variant classes
  const variantClasses: Record<string, Record<string, string>> = {};
  if (config.variants) {
    for (const [variantName, variantValues] of Object.entries(config.variants)) {
      variantClasses[variantName] = {};
      for (const [valueName, styleStr] of Object.entries(variantValues)) {
        const styles = parseStyles(styleStr);
        const { className, css } = generateAtomicCSS(componentName, styles, options);
        variantClasses[variantName][valueName] = className;
        storeCss(componentName, css);
      }
    }
  }

  // Return runtime function (will be transformed at build time)
  return (props = {}) => {
    const classes: string[] = [baseClass];

    // Add variant classes
    for (const [variantName, variantValue] of Object.entries(props)) {
      const value = variantValue || config.defaultVariants?.[variantName];
      if (value && variantClasses[variantName]?.[value]) {
        classes.push(variantClasses[variantName][value]);
      }
    }

    // Add default variants
    if (config.defaultVariants) {
      for (const [variantName, defaultValue] of Object.entries(config.defaultVariants)) {
        if (!props[variantName] && variantClasses[variantName]?.[defaultValue]) {
          classes.push(variantClasses[variantName][defaultValue]);
        }
      }
    }

    return classes.join(" ");
  };
}

/**
 * Slot Class Variants - Define multi-element component variants
 *
 * @example
 * ```ts
 * const card = css.scv({
 *   slots: ['root', 'header', 'title', 'content'],
 *   base: {
 *     root: "rounded-lg border shadow-sm",
 *     header: "border-b p-6",
 *     title: "text-lg font-semibold"
 *   },
 *   variants: {
 *     variant: {
 *       default: { root: "border-gray-200" },
 *       primary: { root: "border-blue-200", title: "text-blue-900" }
 *     }
 *   }
 * });
 * ```
 */
export function scv(
  config: SlotVariantConfig
): (props?: Record<string, string>) => Record<string, string> {
  const options = { devPrefix: true, hashLength: 7 };
  const componentName = "Component";

  // Generate classes for each slot
  const slotClasses: Record<string, string> = {};

  for (const slot of config.slots) {
    const baseStyle = config.base?.[slot] || "";
    const styles = parseStyles(baseStyle);
    const { className, css } = generateAtomicCSS(componentName, styles, options);
    slotClasses[slot] = className;
    storeCss(componentName, css);
  }

  return (props = {}) => slotClasses;
}

/**
 * Style Variants - Define inline style variants
 *
 * @example
 * ```ts
 * const box = css.sv({
 *   base: { display: "flex", borderRadius: "8px" },
 *   variants: {
 *     size: {
 *       sm: { padding: "8px" },
 *       lg: { padding: "24px" }
 *     }
 *   }
 * });
 * ```
 */
export function sv(
  config: StyleVariantConfig
): (props?: Record<string, string>) => Record<string, string> {
  return (props = {}) => {
    const styles: Record<string, string> = { ...config.base };

    if (config.variants && props) {
      for (const [variantName, variantValue] of Object.entries(props)) {
        const value = variantValue || config.defaultVariants?.[variantName];
        if (value && config.variants[variantName]?.[value]) {
          Object.assign(styles, config.variants[variantName][value]);
        }
      }
    }

    return styles;
  };
}

/**
 * Slot Style Variants - Define multi-element inline style variants
 */
export function ssv(
  config: SlotVariantConfig
): (props?: Record<string, string>) => Record<string, Record<string, string>> {
  return (props = {}) => {
    const result: Record<string, Record<string, string>> = {};

    for (const slot of config.slots) {
      const styles: Record<string, string> = {};

      if (config.base?.[slot]) {
        Object.assign(styles, parseStyles(config.base[slot]).reduce((acc, s) => {
          acc[s.property] = s.value;
          return acc;
        }, {} as Record<string, string>));
      }

      result[slot] = styles;
    }

    return result;
  };
}

/**
 * Class name merger - Merge multiple class values into a single string
 *
 * Runtime utility (no CSS generation)
 *
 * @example
 * ```ts
 * css.cx("btn", "btn-primary") // "btn btn-primary"
 * css.cx("btn", isActive && "active") // "btn active" or "btn"
 * css.cx("btn", { disabled: true }) // "btn disabled"
 * ```
 */
export function cx(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === "string" || typeof input === "number") {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const flattened = cx(...input);
      if (flattened) classes.push(flattened);
    } else if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }

  return classes.join(" ");
}

/**
 * Compile-time class name merger (alias for cx)
 *
 * Merges class names at build time when all values are known
 */
export const cn = cx;
