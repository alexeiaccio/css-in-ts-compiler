/**
 * CSS Generator for variant-based atomic CSS
 *
 * Generates atomic CSS classes from cv/scv variant definitions
 * with proper layering and hashing
 */

import { Effect, Console } from "effect";
import { generateClassName, type HashOptions } from "./hash.js";
import { getLayerForDepth, wrapInLayer } from "./layers.js";
import { parseDeclarations, type CSSDeclaration } from "./css-parser.js";
import { storeCss } from "./virtual-css.js";

export interface GeneratedCSS {
  /** Generated CSS code */
  css: string;
  /** Class names by variant */
  classNames: ClassNameMap;
}

export interface ClassNameMap {
  /** Base class name */
  base: string;
  /** Variant class names by variant name and value */
  variants: Record<string, Record<string, string>>;
}

export interface CSSGeneratorOptions {
  /** Component name for class prefix in dev */
  componentName: string;
  /** Hash options */
  hash: HashOptions;
  /** Whether to wrap in layers */
  useLayers: boolean;
}

/**
 * Generate atomic CSS class from declarations
 */
function generateAtomicClass(
  componentName: string,
  declarations: CSSDeclaration[],
  options: CSSGeneratorOptions
): { className: string; css: string } {
  // Create content hash from all declarations
  const content = declarations.map((d) => `${d.property}:${d.value}`).join(";");
  const className = generateClassName(componentName, content, options.hash);

  // Build CSS rule
  const declarationStr = declarations
    .map((d) => `  ${d.property}: ${d.value};`)
    .join("\n");

  const css = `.${className} {\n${declarationStr}\n}`;

  return { className, css };
}

/**
 * Parse style string into atomic CSS class
 */
function styleToAtomicClass(
  componentName: string,
  styleStr: string,
  options: CSSGeneratorOptions
): { className: string; css: string } | null {
  const declarations = parseDeclarations(styleStr);

  if (declarations.length === 0) {
    return null;
  }

  return generateAtomicClass(componentName, declarations, options);
}

/**
 * Generate CSS from class variants (cv)
 */
export const generateVariantCSS = Effect.fn("generateVariantCSS")(
  function* (
    componentName: string,
    config: {
      base?: string;
      variants?: Record<string, Record<string, string>>;
    },
    options: CSSGeneratorOptions
  ) {
    yield* Console.info(`Generating CSS for ${componentName}`);

    const cssParts: string[] = [];
    const classNames: ClassNameMap = {
      base: "",
      variants: {},
    };

    // Generate base class
    if (config.base) {
      const baseResult = styleToAtomicClass(componentName, config.base, options);
      if (baseResult) {
        classNames.base = baseResult.className;

        // Store base CSS (layer _.a - base styles)
        if (options.useLayers) {
          const layered = wrapInLayer(baseResult.css, getLayerForDepth(0));
          cssParts.push(layered);
        } else {
          cssParts.push(baseResult.css);
        }

        storeCss(componentName, baseResult.css);
        yield* Console.debug(`Generated base class: ${baseResult.className}`);
      }
    }

    // Generate variant classes
    if (config.variants) {
      for (const [variantName, variantValues] of Object.entries(config.variants)) {
        classNames.variants[variantName] = {};

        for (const [valueName, styleStr] of Object.entries(variantValues)) {
          const variantResult = styleToAtomicClass(componentName, styleStr, options);

          if (variantResult) {
            classNames.variants[variantName][valueName] = variantResult.className;

            // Store variant CSS (layer _.a - base variants)
            if (options.useLayers) {
              const layered = wrapInLayer(variantResult.css, getLayerForDepth(0));
              cssParts.push(layered);
            } else {
              cssParts.push(variantResult.css);
            }

            storeCss(componentName, variantResult.css);
            yield* Console.debug(
              `Generated variant class: ${variantResult.className} (${variantName}:${valueName})`
            );
          }
        }
      }
    }

    const css = cssParts.join("\n\n");
    yield* Console.info(`Generated ${cssParts.length} CSS rules for ${componentName}`);

    return { css, classNames };
  }
);

/**
 * Generate CSS from slot variants (scv)
 */
export const generateSlotVariantCSS = Effect.fn("generateSlotVariantCSS")(
  function* (
    componentName: string,
    config: {
      slots: string[];
      base?: Record<string, string>;
      variants?: Record<string, Record<string, Record<string, string>>>;
    },
    options: CSSGeneratorOptions
  ) {
    yield* Console.info(`Generating slot CSS for ${componentName}`);

    const cssParts: string[] = [];
    const slotClassNames: Record<
      string,
      { base: string; variants: Record<string, Record<string, string>> }
    > = {};

    // Initialize slots
    for (const slot of config.slots) {
      slotClassNames[slot] = { base: "", variants: {} };
    }

    // Generate base classes per slot
    if (config.base) {
      for (const [slot, styleStr] of Object.entries(config.base)) {
        const slotResult = styleToAtomicClass(componentName, styleStr, options);

        if (slotResult && slotClassNames[slot]) {
          slotClassNames[slot].base = slotResult.className;

          if (options.useLayers) {
            const layered = wrapInLayer(slotResult.css, getLayerForDepth(0));
            cssParts.push(layered);
          } else {
            cssParts.push(slotResult.css);
          }

          storeCss(componentName, slotResult.css);
          yield* Console.debug(`Generated slot base class: ${slotResult.className} (${slot})`);
        }
      }
    }

    // Generate variant classes per slot
    if (config.variants) {
      for (const [variantName, variantValues] of Object.entries(config.variants)) {
        for (const [valueName, slotStyles] of Object.entries(variantValues)) {
          for (const [slot, styleStr] of Object.entries(slotStyles)) {
            if (!slotClassNames[slot]) continue;
            if (!slotClassNames[slot].variants[variantName]) {
              slotClassNames[slot].variants[variantName] = {};
            }

            const variantResult = styleToAtomicClass(componentName, styleStr, options);

            if (variantResult && slotClassNames[slot]?.variants[variantName]) {
              slotClassNames[slot].variants[variantName][valueName] = variantResult.className;

              if (options.useLayers) {
                const layered = wrapInLayer(variantResult.css, getLayerForDepth(0));
                cssParts.push(layered);
              } else {
                cssParts.push(variantResult.css);
              }

              storeCss(componentName, variantResult.css);
            }
          }
        }
      }
    }

    const css = cssParts.join("\n\n");
    yield* Console.info(`Generated slot CSS for ${componentName}`);

    return { css, classNames: slotClassNames };
  }
);

/**
 * Synchronous version of generateVariantCSS
 */
export function generateVariantCSSSync(
  componentName: string,
  config: {
    base?: string;
    variants?: Record<string, Record<string, string>>;
  },
  options: CSSGeneratorOptions
): GeneratedCSS {
  return Effect.runSync(generateVariantCSS(componentName, config, options));
}

/**
 * Synchronous version of generateSlotVariantCSS
 */
export function generateSlotVariantCSSSync(
  componentName: string,
  config: {
    slots: string[];
    base?: Record<string, string>;
    variants?: Record<string, Record<string, Record<string, string>>>;
  },
  options: CSSGeneratorOptions
): {
  css: string;
  classNames: Record<string, { base: string; variants: Record<string, Record<string, string>> }>;
} {
  return Effect.runSync(generateSlotVariantCSS(componentName, config, options));
}
