import * as Effect from "effect";
import * as Logger from "effect/Logger";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";

export interface IconPluginConfig {
  logLevel?: "off" | "error" | "warning" | "info" | "debug" | "trace" | "all";
  cache?: boolean;
  preloadIcons?: readonly string[];
  generateTypes?: boolean;
  typesOutputPath?: string;
}

export const DEFAULT_CONFIG: IconPluginConfig = {
  logLevel: "info",
  cache: true,
  generateTypes: true,
  typesOutputPath: ".cssints/generated",
};

const CONFIG_PATH = ".cssints-icon-config.json";

export const iconLogger = Logger.make({
  name: "@cssints/plugin-icon",
  minLogLevel: DEFAULT_CONFIG.logLevel,
});

let currentConfig = { ...DEFAULT_CONFIG };

export function getConfig(): Effect.Effect<IconPluginConfig, never> {
  return Effect.gen(function* ($) {
    const exists = yield* $(FileSystem.exists(CONFIG_PATH));

    if (!exists) {
      return DEFAULT_CONFIG;
    }

    const content = yield* $(FileSystem.readFileString(CONFIG_PATH));
    const config = JSON.parse(content) as Partial<IconPluginConfig>;

    currentConfig = { ...DEFAULT_CONFIG, ...config };
    return currentConfig;
  });
}

export function setConfig(config: IconPluginConfig): Effect.Effect<void, never> {
  return Effect.gen(function* ($) {
    const content = JSON.stringify(config, null, 2);
    yield* $(FileSystem.writeFile(CONFIG_PATH, content));
    currentConfig = config;
  });
}

export const log = {
  debug: (message: string, ...args: unknown[]) =>
    Effect.logDebug(message, ...(args as any[])),
  info: (message: string, ...args: unknown[]) =>
    Effect.logInfo(message, ...(args as any[])),
  warning: (message: string, ...args: unknown[]) =>
    Effect.logWarning(message, ...(args as any[])),
  error: (message: string, ...args: unknown[]) =>
    Effect.logError(message, ...(args as any[])),
};
