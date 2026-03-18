/**
 * Runtime functions for CSS-in-TS variants
 *
 * These are lightweight runtime functions that get called
 * after the build-time transformation. They compose pre-computed
 * class names based on variant props.
 */

/**
 * Runtime configuration for class variants
 */
export interface CvRuntimeConfig {
  /** Pre-computed class names */
  classes: {
    /** Base class name */
    base: string;
    /** Variant class names by variant name and value */
    variants: Record<string, Record<string, string>>;
  };
  /** Default variant values */
  defaultVariants?: Record<string, string>;
  /** Compound variants for complex conditions */
  compoundVariants?: Array<Record<string, string | string[]> & { className?: string }>;
}

/**
 * Runtime class variants function
 *
 * This is called at runtime after build-time transformation.
 * It composes class names from pre-computed values.
 *
 * @example
 * const button = _cv({
 *   classes: {
 *     base: "Button_a1b2c3",
 *     variants: {
 *       size: { sm: "Button_d4e5f6", lg: "Button_g7h8i9" }
 *     }
 *   },
 *   defaultVariants: { size: "md" }
 * });
 *
 * button({ size: "lg" }) // "Button_a1b2c3 Button_g7h8i9"
 */
export function _cv(config: CvRuntimeConfig): (props?: Record<string, string>) => string {
  return (props = {}) => {
    const classes: string[] = [];

    // Add base class
    if (config.classes.base) {
      classes.push(config.classes.base);
    }

    // Process variants
    for (const [variantName, variantValue] of Object.entries(props)) {
      const value = variantValue || config.defaultVariants?.[variantName];
      if (value && config.classes.variants[variantName]?.[value]) {
        classes.push(config.classes.variants[variantName][value]);
      }
    }

    // Add default variants if not overridden
    if (config.defaultVariants) {
      for (const [variantName, defaultValue] of Object.entries(config.defaultVariants)) {
        if (!props[variantName] && config.classes.variants[variantName]?.[defaultValue]) {
          classes.push(config.classes.variants[variantName][defaultValue]);
        }
      }
    }

    // Process compound variants
    if (config.compoundVariants) {
      for (const compound of config.compoundVariants) {
        const matches = Object.entries(compound).every(([key, value]) => {
          if (key === "className") return true;
          const propValue = props[key] || config.defaultVariants?.[key];
          if (Array.isArray(value)) {
            return value.includes(propValue || "");
          }
          return propValue === value;
        });

        if (matches && compound.className) {
          classes.push(compound.className);
        }
      }
    }

    return classes.join(" ");
  };
}

/**
 * Runtime slot class variants function
 */
export interface ScvRuntimeConfig {
  /** Slots configuration */
  slots: Record<
    string,
    {
      base: string;
      variants: Record<string, Record<string, string>>;
    }
  >;
  /** Default variant values */
  defaultVariants?: Record<string, string>;
}

/**
 * Slot class variants runtime
 */
export function _scv(config: ScvRuntimeConfig): (props?: Record<string, string>) => Record<string, string> {
  return (props = {}) => {
    const result: Record<string, string> = {};

    for (const [slotName, slotConfig] of Object.entries(config.slots)) {
      const classes: string[] = [];

      // Add base class
      if (slotConfig.base) {
        classes.push(slotConfig.base);
      }

      // Process variants
      for (const [variantName, variantValue] of Object.entries(props)) {
        const value = variantValue || config.defaultVariants?.[variantName];
        if (value && slotConfig.variants[variantName]?.[value]) {
          classes.push(slotConfig.variants[variantName][value]);
        }
      }

      // Add default variants
      if (config.defaultVariants) {
        for (const [variantName, defaultValue] of Object.entries(config.defaultVariants)) {
          if (!props[variantName] && slotConfig.variants[variantName]?.[defaultValue]) {
            classes.push(slotConfig.variants[variantName][defaultValue]);
          }
        }
      }

      result[slotName] = classes.join(" ");
    }

    return result;
  };
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
 * Class name merger
 *
 * @example
 * cx("btn", "btn-primary")                    // "btn btn-primary"
 * cx("btn", isActive && "active")             // "btn active" or "btn"
 * cx("btn", { disabled: true })               // "btn disabled"
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
 * Alias for cx
 */
export const cn = cx;
