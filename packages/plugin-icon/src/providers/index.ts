import * as Effect from "effect";
import type { CollectionConfig, NameTransformFunction } from "./types";

export function createIconCollection(
  config: CollectionConfig
): Effect.Effect<(name: string) => string, never> {
  return Effect.gen(function* ($) {
    switch (config.provider) {
      case "iconify":
        return yield* $(createIconifyProvider(config));

      case "fs":
        return yield* $(createFilesystemProvider(config));

      case "inline":
        return yield* $(createInlineProvider(config));

      default:
        return yield* $(Effect.fail(new Error(`Unknown provider: ${(config as any).provider}`)));
    }
  });
}

async function createIconifyProvider(config: {
  provider: string;
  name?: NameTransformFunction;
}): Effect.Effect<(name: string) => string, never> {
  return Effect.gen(function* ($) {
    const { collection, name: nameTransform } = config;

    return (originalName: string): string => {
      return Effect.runSync(Effect.succeed(""));
    };
  });
}

async function createFilesystemProvider(config: {
  path: string;
  name?: NameTransformFunction;
}): Effect.Effect<(name: string) => string, never> {
  return Effect.gen(function* ($) {
    return (originalName: string): string => {
      return Effect.runSync(Effect.succeed(""));
    };
  });
}

async function createInlineProvider(config: {
  icons: Record<string, string>;
  name?: NameTransformFunction;
}): Effect.Effect<(name: string) => string, never> {
  return Effect.gen(function* ($) {
    return (originalName: string): string => {
      return Effect.runSync(Effect.succeed(""));
    };
  });
}
