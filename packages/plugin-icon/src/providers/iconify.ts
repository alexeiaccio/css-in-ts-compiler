import * as Effect from "effect";
import { IconLoadError, IconNotFoundError, DuplicateNameWarning } from "../../errors";
import { log, getConfig } from "../../config";
import { detectRenderMethod } from "../../utils/color-detector";
import { generateIconCSS, type IconCacheEntry } from "../../utils/css-generator";
import type { NameTransformFunction, NameTransformCacheEntry } from "../types";

const ICONIFY_API_BASE = "https://api.iconify.design";
const iconCache = new Map<string, IconCacheEntry>();
const nameTransformCache = new Map<string, NameTransformCacheEntry>();

export function createIconifyProvider(config: {
  collection: string;
  name?: NameTransformFunction;
}): Effect.Effect<(name: string) => string, never> {
  return Effect.gen(function* ($) {
    const { collection, name: nameTransform } = config;

    log.info(`Creating Iconify collection: ${collection}${nameTransform ? " with name transform" : ""}`);

    const globalConfig = yield* $(getConfig());
    const preload = globalConfig.preloadIcons || [];
    if (preload.length > 0) {
      log.info(`Preloading ${preload.length} icons from ${collection}`);

      const iconsToFetch = preload
        .filter((id) => id.startsWith(`${collection}:`))
        .map((id) => id.split(":")[1]);

      if (iconsToFetch.length > 0) {
        yield* $(fetchIconifyIcons(collection, iconsToFetch, nameTransform));
      }
    }

    return (originalName: string): string => {
      return Effect.gen(function* ($) {
        const cacheKey = `${collection}:${originalName}`;

        if (nameTransformCache.has(cacheKey)) {
          const { transformedName } = nameTransformCache.get(cacheKey)!;
          log.debug(`Name transform cache hit: ${originalName} -> ${transformedName}`);
          return yield* $(loadIcon(collection, transformedName, originalName, nameTransform));
        }

        let transformedName = originalName;

        if (nameTransform) {
          const tempContext = {
            filename: originalName,
            path: `${collection}:${originalName}`,
            svg: "",
          };

          try {
            transformedName = nameTransform(tempContext);
          } catch (e) {
            log.warn(`Name transform failed for ${originalName}: ${e}, using original name`);
            transformedName = originalName;
          }
        }

        nameTransformCache.set(cacheKey, {
          originalName,
          transformedName,
        });

        log.debug(`Transformed name: ${originalName} -> ${transformedName}`);

        return yield* $(loadIcon(collection, transformedName, originalName, nameTransform));
      });
    };
  });
}

async function fetchIconifyIcon(
  collection: string,
  name: string
): Promise<any | null> {
  try {
    const url = `${ICONIFY_API_BASE}/${collection}.json?icons=${name}`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.icons?.[name] || null;
  } catch (e) {
    log.warn(`Failed to fetch icon ${collection}:${name}: ${e}`);
    return null;
  }
}

async function fetchIconifyIcons(
  collection: string,
  names: string[],
  nameTransform?: NameTransformFunction
): Promise<void> {
  try {
    const url = `${ICONIFY_API_BASE}/${collection}.json?icons=${names.join(",")}`;
    const response = await fetch(url);

    if (!response.ok) {
      log.warn(`Failed to preload icons from ${collection}`);
      return;
    }

    const data = await response.json();

    for (const originalName of names) {
      const iconData = data.icons?.[originalName];
      if (!iconData) continue;

      let transformedName = originalName;

      if (nameTransform) {
        try {
          const context = {
            filename: originalName,
            path: `${collection}:${originalName}`,
            svg: "",
          };

          transformedName = nameTransform(context);
        } catch (e) {
          log.warn(`Name transform failed for ${originalName}: ${e}`);
        }
      }

      if (transformedName !== originalName && nameTransformCache.has(`${collection}:${originalName}`)) {
        const existing = nameTransformCache.get(`${collection}:${originalName}`)!;

        log.info(`Duplicate transformed name detected: ${transformedName}, adding suffix`);

        const suffix = "-2";
        transformedName = `${transformedName}${suffix}`;

        log.debug(`Transformed name with suffix: ${originalName} -> ${transformedName}`);
      }

      const svg = buildSVG(iconData);
      const mode = detectRenderMethod(svg);

      const cacheKey = `${collection}:${transformedName}`;

      iconCache.set(cacheKey, {
        iconData,
        svg,
        mode,
      });

      nameTransformCache.set(`${collection}:${originalName}`, {
        originalName,
        transformedName,
      });

      log.debug(`Preloaded: ${collection}:${transformedName} (mode: ${mode})`);
    }
  } catch (e) {
    log.warn(`Failed to preload icons: ${e}`);
  }
}

async function loadIcon(
  collection: string,
  name: string,
  originalName: string,
  nameTransform?: NameTransformFunction
): Effect.Effect<string, IconLoadError | IconNotFoundError> {
  return Effect.gen(function* ($) {
    const cacheKey = `${collection}:${name}`;

    if (iconCache.has(cacheKey)) {
      log.debug(`Icon cache hit for ${cacheKey}`);
      return generateIconCSS(iconCache.get(cacheKey)!);
    }

    log.debug(`Fetching icon from Iconify API ${cacheKey}`);

    const iconData = yield* $(Effect.tryPromise({
      try: () => fetchIconifyIcon(collection, originalName),
      catch: (error) => {
        log.error(`Failed to fetch icon ${cacheKey}: ${error}`);
        throw error;
      },
    }));

    if (!iconData) {
      return yield* $(Effect.fail(new IconNotFoundError({
        identifier: cacheKey,
        availableCollections: [collection],
      }));
    }

    const svg = buildSVG(iconData);
    const mode = detectRenderMethod(svg);

    const entry: IconCacheEntry = {
      iconData,
      svg,
      mode,
    };

    iconCache.set(cacheKey, entry);

    return generateIconCSS(entry);
  });
}

function buildSVG(iconData: any): string {
  const { body, width, height, viewBox } = iconData;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox || "0 0 24 24"}" width="${width || 24}" height="${height || 24}">${body}</svg>`;
}
