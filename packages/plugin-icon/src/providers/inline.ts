import * as Effect from "effect";
import { InvalidIconIdentifier, DuplicateNameWarning } from "../../errors";
import { log, getConfig } from "../../config";
import { detectRenderMethod } from "../../utils/color-detector";
import { generateIconCSS, type IconCacheEntry } from "../../utils/css-generator";
import type { NameTransformFunction, NameTransformCacheEntry } from "../types";

const inlineCache = new Map<string, IconCacheEntry>();
const nameTransformCache = new Map<string, NameTransformCacheEntry>();
const usedTransformedNames = new Set<string>();

export function createInlineProvider(config: {
  icons: Record<string, string>;
  name?: NameTransformFunction;
}): Effect.Effect<(name: string) => string, never> {
  return Effect.gen(function* ($) {
    const { icons, name: nameTransform } = config;
    const iconNames = Object.keys(icons);

    log.info(`Creating inline collection with ${iconNames.length} icons${nameTransform ? " with name transform" : ""}`);

    for (const originalName of iconNames) {
      const svg = icons[originalName];
      const mode = detectRenderMethod(svg);

      let transformedName = originalName;

      if (nameTransform) {
        try {
          transformedName = nameTransform({
            filename: originalName,
            path: undefined,
            svg: svg,
          });
        } catch (e) {
          log.warn(`Name transform failed for ${originalName}: ${e}`);
          transformedName = originalName;
        }

        if (transformedName !== originalName && usedTransformedNames.has(transformedName)) {
          log.info(`Duplicate transformed name detected: ${transformedName}, adding suffix`);

          const suffixNum = [...usedTransformedNames]
            .filter((n) => n.startsWith(transformedName))
            .length + 1;

          const suffixedName = `${transformedName}-${suffixNum}`;
          log.debug(`Transformed name with suffix: ${originalName} -> ${suffixedName}`);

          usedTransformedNames.add(suffixedName);
          nameTransformCache.set(originalName, {
            originalName,
            transformedName: suffixedName,
          });

          transformedName = suffixedName;
        } else {
          usedTransformedNames.add(transformedName);
          nameTransformCache.set(originalName, {
            originalName,
            transformedName,
          });
        }
      }

      inlineCache.set(transformedName, { svg, mode });

      log.debug(`Preprocessed: ${transformedName} (mode: ${mode})`);
    }

    return (originalName: string): string => {
      return Effect.gen(function* ($) {
        const cacheKey = originalName;

        if (nameTransformCache.has(cacheKey)) {
          const { transformedName } = nameTransformCache.get(cacheKey)!;
          log.debug(`Name transform cache hit: ${originalName} -> ${transformedName}`);
          return generateIconCSS(inlineCache.get(transformedName)!);
        }

        return yield* $(Effect.fail(new InvalidIconIdentifier({
          identifier: originalName,
          cause: `Icon not found in inline collection: ${originalName}`,
        }));
      });
    };
  };
}
