import type { IconifyIcon } from "@iconify/types";

export type ProviderType = "iconify" | "fs" | "inline";

export interface NameTransformContext {
  filename: string;
  path: string;
  svg: string;
}

export type NameTransformFunction = (context: NameTransformContext) => string;

export interface IconConfig {
  collection: string;
  name?: string;
  color?: string;
  size?: string;
}

interface NameTransformCacheEntry {
  originalName: string;
  transformedName: string;
}

export interface IconifyProviderConfig {
  provider: "iconify";
  collection: string;
  name?: NameTransformFunction;
}

export interface FilesystemProviderConfig {
  provider: "fs";
  path: string;
  name?: NameTransformFunction;
}

export interface InlineProviderConfig {
  provider: "inline";
  icons: Record<string, string>;
  name?: NameTransformFunction;
}

export type CollectionConfig =
  | IconifyProviderConfig
  | FilesystemProviderConfig
  | InlineProviderConfig;

export interface IconProvider {
  loadIcon: (name: string) => Effect.Effect<string, never>;
}

export type IconCollectionType<T extends string> = IconCollection<T>;

export interface IconCollection<T extends string> {
  (name: T): string;
}
