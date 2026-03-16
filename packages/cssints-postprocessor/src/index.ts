/**
 * CSS-in-TS Post-Processor
 * Transforms placeholder CSS into actual CSS
 */

import { Effect, Console, Data } from "effect";
import { transform } from "lightningcss";
import { PostProcessError } from "./errors.js";

// Re-export errors
export { PostProcessError, VisitorError } from "./errors.js";

/**
 * Post-processor options
 */
export interface PostProcessOptions {
  /** Minify the output */
  minify?: boolean;
  /** Target browsers for vendor prefixing */
  targets?: Record<string, number>;
}

/**
 * Post-processor result
 */
export interface PostProcessResult {
  /** Generated CSS code */
  code: string;
  /** Source map (if requested) */
  map?: string;
}

// Track processed atoms for deduplication
const processedAtoms = new Map<string, string>();
const processedCalcs = new Map<string, string>();

/**
 * Generate hash for atomic CSS
 */
const generateHash = (input: string): string => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return "_" + Math.abs(hash).toString(16).padStart(6, "0").slice(0, 6);
};

/**
 * Process @atomic rules
 * Converts: @atomic padding 1rem { }
 * To: ._{hash} { padding: 1rem; }
 */
const processAtomicRules = (css: string): string => {
  processedAtoms.clear();
  
  return css.replace(/@atomic\s+(\S+)\s+(\S+)\s*\{\s*\}/g, (match, property, value) => {
    const key = `${property}:${value}`;
    
    // Check for duplicates
    if (processedAtoms.has(key)) {
      return "";
    }
    
    const className = generateHash(key);
    processedAtoms.set(key, className);
    
    // Handle shorthand properties
    let declarations = `${property}: ${value};`;
    if (property === "padding-x") {
      declarations = `padding-left: ${value}; padding-right: ${value};`;
    } else if (property === "padding-y") {
      declarations = `padding-top: ${value}; padding-bottom: ${value};`;
    } else if (property === "margin-x") {
      declarations = `margin-left: ${value}; margin-right: ${value};`;
    } else if (property === "margin-y") {
      declarations = `margin-top: ${value}; margin-bottom: ${value};`;
    }
    
    return `.${className} { ${declarations} }`;
  });
};

/**
 * Process @calc rules
 * Converts: @calc _abc123 100vw - 1rem { }
 * To: ._abc123 { width: calc(100vw - 1rem); }
 */
const processCalcRules = (css: string): string => {
  processedCalcs.clear();
  
  return css.replace(/@calc\s+(\S+)\s+(.+?)\s*\{\s*\}/g, (match, className, expression) => {
    // Check for duplicates
    if (processedCalcs.has(className)) {
      return "";
    }
    
    processedCalcs.set(className, expression);
    return `.${className} { width: calc(${expression}); }`;
  });
};

/**
 * Wrap CSS in cascade layers
 * Note: @property rules cannot be inside @layer, so they stay at the top level
 */
const wrapInLayers = (css: string): string => {
  // Simple layer wrapping - put @property outside layers, everything else in _.b
  const rules = css.split('}').filter(r => r.trim()).map(r => r + '}');
  const themeRules: string[] = [];  // @property rules
  const utilityRules: string[] = [];  // Everything else
  
  for (const rule of rules) {
    if (rule.includes('@property')) {
      themeRules.push(rule);
    } else {
      utilityRules.push(rule);
    }
  }
  
  let result = '';
  
  // @property rules first (outside of layers)
  if (themeRules.length > 0) {
    result += themeRules.join('\n');
    result += '\n\n';
  }
  
  // Layer declaration and utility layer
  if (utilityRules.length > 0) {
    result += '@layer _.b {\n';
    result += utilityRules.join('\n');
    result += '\n}\n';
  }
  
  return result;
};

/**
 * Process placeholder CSS and transform it into actual CSS
 * 
 * @example
 * ```typescript
 * const result = await processCSS(`
 *   @atomic padding 1rem { }
 *   @calc _a1b2c3 100vw - 1rem { }
 * `);
 * 
 * console.log(result.code);
 * // @layer _.a, _.b;
 * // @layer _.b {
 * //   ._a1b2c3 { padding: 1rem; }
 * //   ._d4e5f6 { width: calc(100vw - 1rem); }
 * // }
 * ```
 */
export const processCSS = Effect.fn("processCSS")(
  function* (css: string, options: PostProcessOptions = {}) {
    yield* Console.info(`Processing CSS (${css.length} bytes)`);

    // Step 1: Process @atomic rules
    let processedCSS = processAtomicRules(css);
    yield* Console.debug(`Processed @atomic rules`);
    
    // Step 2: Process @calc rules
    processedCSS = processCalcRules(processedCSS);
    yield* Console.debug(`Processed @calc rules`);
    
    // Step 3: Wrap in layers
    processedCSS = wrapInLayers(processedCSS);
    yield* Console.debug(`Wrapped in layers`);

    // Step 4: Run through LightningCSS for minification and optimization
    const result = yield* Effect.try({
      try: () => {
        return transform({
          filename: "input.css",
          code: Buffer.from(processedCSS),
          minify: options.minify ?? true,
          targets: options.targets,
        });
      },
      catch: (error) =>
        new PostProcessError({
          message: `CSS transformation failed: ${error instanceof Error ? error.message : String(error)}`,
          details: error,
        }),
    });

    yield* Console.info(`CSS processed successfully (${result.code.length} bytes output)`);

    return {
      code: result.code.toString(),
      map: result.map?.toString(),
    } as PostProcessResult;
  }
);

/**
 * Process CSS synchronously
 * Use this when you need immediate results
 */
export const processCSSSync = (css: string, options: PostProcessOptions = {}): PostProcessResult => {
  return Effect.runSync(processCSS(css, options));
};
