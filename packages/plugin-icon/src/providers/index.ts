import { Effect } from "effect";

import type { CollectionConfig, NameTransformFunction, NameTransformContext } from "./types.js";

export function createIconCollection(config: CollectionConfig): Effect.Effect<(name: string) => string, never> {
	return Effect.gen(function* () {
		switch (config.provider) {
			case "iconify":
				return yield* createIconifyProvider(config);

			case "fs":
				return yield* createFilesystemProvider(config);

			case "inline":
				return yield* createInlineProvider(config);

			default:
				return (name: string) => name;
		}
	});
}

function createIconifyProvider(config: {
	provider: "iconify";
	collection?: string;
	name?: NameTransformFunction;
}): Effect.Effect<(name: string) => string, never> {
	return Effect.gen(function* () {
		const nameTransform = config.name ?? ((ctx: NameTransformContext) => ctx.filename);

		return (originalName: string): string => {
			return nameTransform({ filename: originalName, path: "", svg: "" });
		};
	});
}

function createFilesystemProvider(config: {
	provider: "fs";
	path: string;
	name?: NameTransformFunction;
}): Effect.Effect<(name: string) => string, never> {
	return Effect.gen(function* () {
		const nameTransform = config.name ?? ((ctx: NameTransformContext) => ctx.filename);

		return (originalName: string): string => {
			return nameTransform({ filename: originalName, path: config.path, svg: "" });
		};
	});
}

function createInlineProvider(config: {
	provider: "inline";
	icons: Record<string, string>;
	name?: NameTransformFunction;
}): Effect.Effect<(name: string) => string, never> {
	return Effect.gen(function* () {
		const nameTransform = config.name ?? ((ctx: NameTransformContext) => ctx.filename);

		return (originalName: string): string => {
			const svg = config.icons[originalName] ?? "";
			return nameTransform({ filename: originalName, path: "", svg });
		};
	});
}
