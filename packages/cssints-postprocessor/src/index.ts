/**
 * CSS-in-TS Post-Processor
 * Transforms placeholder CSS into actual CSS using LightningCSS visitors
 */

import { Effect, Console, Data } from "effect";
import { transform, composeVisitors } from "lightningcss";
import type { StyleSheet } from "lightningcss";

import { createAtomicVisitor, resetAtomicRegistry } from "./visitors/atomic-visitor.js";
import { createCalcVisitor, resetCalcRegistry } from "./visitors/calc-visitor.js";
import { createLayerVisitor, LayerOptions } from "./visitors/layer-visitor.js";
import { PostProcessError } from "./errors.js";

// Re-export visitors
export {
  createAtomicVisitor,
  resetAtomicRegistry,
  createCalcVisitor,
  resetCalcRegistry,
  createLayerVisitor,
  type LayerOptions,
} from "./visitors/index.js";

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
  /** CSS layer configuration */
  layers?: LayerOptions;
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
 * // ._a1b2c3 { padding: 1rem; }
 * // ._d4e5f6 { width: calc(100vw - 1rem); }
 * ```
 */
export const processCSS = Effect.fn("processCSS")(
  function* (css: string, options: PostProcessOptions = {}) {
    yield* Console.info(`Processing CSS (${css.length} bytes)`);

    // Reset registries for fresh processing
    resetAtomicRegistry();
    resetCalcRegistry();

    const result = yield* Effect.try({
      try: () => {
        return transform({
          filename: "input.css",
          code: Buffer.from(css),
          minify: options.minify ?? true,
          targets: options.targets,
          customAtRules: {
            atomic: {
              prelude: "<custom-ident> <declaration-value>",
              body: "declaration-list",
            },
            calc: {
              prelude: "<custom-ident> <declaration-value>",
              body: "declaration-list",
            },
          },
          visitor: composeVisitors([
            createAtomicVisitor(),
            createCalcVisitor(),
            createLayerVisitor(options.layers),
          ]),
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
