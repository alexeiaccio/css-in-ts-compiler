import * as Effect from "effect";
import * as Path from "effect/Path";
import * as FileSystem from "effect/FileSystem";
import { InvalidIconIdentifier, DuplicateNameWarning } from "../../errors";
import { log, getConfig } from "../../config";
import { detectRenderMethod } from "../../utils/color-detector";
import { generateIconCSS, type IconCacheEntry } from "../../utils/css-generator";
import type { NameTransformFunction, NameTransformCacheEntry } from "../types";

const fsCache = new Map<string, IconCacheEntry>();
const nameTransformCache = new Map<string, NameTransformCacheEntry>();
const usedTransformedNames = new Set<string>();

export function createFilesystemProvider(config: {
  path: string;
  name?: NameTransformFunction;
}): Effect.Effect<(name: string) => string, never> {
  return Effect.gen(function* ($) {
    const { path: userPath, name: nameTransform } = config;

    log.info(`Creating filesystem collection from: ${userPath}${nameTransform ? " with name transform" : ""}`);

    const exists = yield* $(FileSystem.exists(userPath));
    if (!exists) {
      return yield* $(Effect.fail(new InvalidIconIdentifier({
        identifier: userPath,
        cause: `Path does not exist: ${userPath}`,
      }));
    }

    const absolutePath = yield* $(Path.resolve(userPath));

    return (originalName: string): string => {
      return Effect.gen(function* ($) {
        const cacheKey = `${absolutePath}:${originalName}`;

        if (nameTransformCache.has(cacheKey)) {
          const { transformedName } = nameTransformCache.get(cacheKey)!;
          log.debug(`Name transform cache hit: ${originalName} -> ${transformedName}`);
          return yield* $(loadIcon(absolutePath, transformedName, originalName, nameTransform));
        }

        let transformedName = originalName;

        if (nameTransform) {
          const svgPath = yield* $(Path.join(absolutePath, `${originalName}.svg`));
          const svgExists = yield* $(FileSystem.exists(svgPath));

          let svgContent = "";
          let filePath = svgPath;

          if (svgExists) {
            filePath = svgPath;
            svgContent = yield* $(FileSystem.readFileString(svgPath));
          } else {
            const jsonPath = yield* $(Path.join(absolutePath, `${originalName}.json`));
            const jsonExists = yield* $(FileSystem.exists(jsonPathPath));

            if (!jsonExists) {
              return yield* $(Effect.fail(new InvalidIconIdentifier({
                identifier: `${userPath}:${originalName}`,
                cause: `Icon not found: ${originalName}`,
              }));
            }

            filePath = jsonPath;
            const jsonContent = yield* $(FileSystem.readFileString(jsonPath));
            const iconData = JSON.parse(jsonContent);
            svgContent = buildSVGFromData(iconData);
          }

          try {
            transformedName = nameTransform({
              filename: originalName,
              path: filePath,
              svg: svgContent,
            });
          } catch (e) {
            log.warn(`Name transform failed for ${originalName}: ${e}, using original name`);
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
            nameTransformCache.set(cacheKey, {
              originalName,
              transformedName: suffixedName,
            });

            transformedName = suffixedName;
          } else {
            usedTransformedNames.add(transformedName);
            nameTransformCache.set(cacheKey, {
              originalName,
              transformedName,
            });
          }
        }

        return yield* $(loadIcon(absolutePath, transformedName, originalName, nameTransform));
      });
    };
  });
}

async function loadIcon(
  path: string,
  name: string,
  originalName: string,
  nameTransform?: NameTransformFunction
): Effect.Effect<string, InvalidIconIdentifier> {
  return Effect.gen(function* ($) {
    const cacheKey = `${path}:${name}`;

    if (fsCache.has(cacheKey)) {
      log.debug(`FS cache hit for ${cacheKey}`);
      return generateIconCSS(fsCache.get(cacheKey)!);
    }

    const svgPath = yield* $(Path.join(path, `${originalName}.svg`));
    const exists = yield* $(FileSystem.exists(svgPath));

    let svgContent = "";

    if (exists) {
      svgContent = yield* $(FileSystem.readFileString(svgPath));
    } else {
      const jsonPath = yield* $(Path.join(path, `${originalName}.json`));
      const jsonExists = yield* $(FileSystem.exists(jsonPathPath));

      if (!jsonExists) {
        return yield* $(Effect.fail(new InvalidIconIdentifier({
          identifier: `${path}:${originalName}`,
          cause: `Icon not found: ${originalName}`,
        }));
      }

      const jsonContent = yield* $(FileSystem.readFileString(jsonPathPath));
      const iconData = JSON.parse(jsonContent);
      svgContent = buildSVGFromData(iconData);
    }

    const mode = detectRenderMethod(svgContent);
    const entry: IconCacheEntry = { svg: svgContent, mode };

    fsCache.set(cacheKey, entry);

    return generateIconCSS(entry);
  });
}

function buildSVGFromData(iconData: any): string {
  const { body, width, height, viewBox } = iconData;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox || "0 0 24 24"}" width="${width || 24}" height="${height || 24}">${body}</svg>`;
}
