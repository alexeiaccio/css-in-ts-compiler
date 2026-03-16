import { Effect, Console } from "effect";

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

let currentConfig = { ...DEFAULT_CONFIG };

export function getConfig(): Effect.Effect<IconPluginConfig, never> {
  return Effect.sync(() => currentConfig);
}

export function setConfig(config: IconPluginConfig): Effect.Effect<void, never> {
  return Effect.sync(() => {
    currentConfig = config;
  });
}

export const log = {
  debug: (message: string, ...args: unknown[]) =>
    Console.log(`[DEBUG] ${message}`, ...args),
  info: (message: string, ...args: unknown[]) =>
    Console.log(`[INFO] ${message}`, ...args),
  warning: (message: string, ...args: unknown[]) =>
    Console.warn(`[WARN] ${message}`, ...args),
  error: (message: string, ...args: unknown[]) =>
    Console.error(`[ERROR] ${message}`, ...args),
};