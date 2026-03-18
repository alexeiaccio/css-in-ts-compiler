/**
 * Unified postprocessing pipeline
 *
 * Combines LightningCSS visitors into a single transformation
 */

import { Effect, Console } from "effect";
import { transform, type Targets } from "lightningcss";
import { PostProcessError } from "../errors.js";
import { createAtomicVisitor, resetAtomicRegistry } from "./atomic-visitor.js";
import { createCalcVisitor, resetCalcRegistry } from "./calc-visitor.js";
import { createLayerVisitor, type LayerOptions } from "./layer-visitor.js";

export interface PostProcessOptions {
  /** Minify the output */
  minify?: boolean;
  /** Target browsers for vendor prefixing */
  targets?: Targets;
  /** Layer options */
  layers?: LayerOptions;
}

export interface PostProcessResult {
  /** Generated CSS code */
  code: string;
  /** Source map (if requested) */
  map?: string;
}

/**
 * Compose multiple visitors into a single visitor object
 */
const composeVisitors = (...visitors: Array<Record<string, unknown>>) => {
  const composed: Record<string, unknown> = {};

  for (const visitor of visitors) {
    for (const [key, value] of Object.entries(visitor)) {
      if (key in composed) {
        // Merge visitors with same key
        if (typeof composed[key] === "object" && typeof value === "object") {
          composed[key] = { ...composed[key], ...value };
        }
      } else {
        composed[key] = value;
      }
    }
  }

  return composed;
};

/**
 * Process CSS through the full pipeline
 *
 * 1. Reset registries
 * 2. Apply atomic visitor
 * 3. Apply calc visitor
 * 4. Apply layer visitor
 * 5. Transform with LightningCSS
 */
export const postprocessCSS = Effect.fn("postprocessCSS")(
  function* (css: string, options: PostProcessOptions = {}) {
    yield* Console.info(`Processing CSS (${css.length} bytes)`);

    // Reset registries for fresh processing
    resetAtomicRegistry();
    resetCalcRegistry();

    // Create visitors
    const atomicVisitor = createAtomicVisitor();
    const calcVisitor = createCalcVisitor();
    const layerVisitor = createLayerVisitor(options.layers);

    // Compose visitors
    const visitor = composeVisitors(atomicVisitor, calcVisitor, layerVisitor);

    // Transform with LightningCSS using visitors
    const result = yield* Effect.try({
      try: () => {
        return transform({
          filename: "input.css",
          code: Buffer.from(css),
          minify: options.minify ?? true,
          targets: options.targets,
          visitor,
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
export const postprocessCSSSync = (css: string, options: PostProcessOptions = {}): PostProcessResult => {
  return Effect.runSync(postprocessCSS(css, options));
};
