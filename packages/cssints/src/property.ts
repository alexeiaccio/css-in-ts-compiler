/**
 * Direct @property API
 * Effect TypeScript patterns
 */

import { Effect, Data, Console } from "effect";

// ============================================================================
// Error Types
// ============================================================================

export class PropertyError extends Data.TaggedError("PropertyError")<{
	message: string;
	propertyName?: string;
}> {}

// ============================================================================
// Property Definition
// ============================================================================

export interface PropertyDefinition {
	name?: string;
	syntax: string;
	inherits: boolean;
	initialValue: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

const generateHash = (input: string): string => {
	let hash = 0;
	for (let i = 0; i < input.length; i++) {
		const char = input.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash).toString(16).slice(0, 8);
};

// ============================================================================
// Core Property Function
// ============================================================================

/**
 * Direct @property API
 * @example
 * property({
 *   name: '--accent',
 *   syntax: '<color>',
 *   inherits: true,
 *   initialValue: '#ff0000'
 * })
 */
export const property = Effect.fn("property")(function* (
	this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
	def: PropertyDefinition,
) {
	yield* Console.debug(`Creating @property: ${def.name || "auto-generated"}`);

	const varName = def.name || `--_${generateHash(def.syntax + def.initialValue)}`;

	const propertyRule = `@property ${varName} {
  syntax: "${def.syntax}";
  inherits: ${def.inherits};
  initial-value: ${def.initialValue};
}`;

	if (this?.addAsset) {
		yield* Effect.sync(() => {
			this.addAsset!({ type: "css", content: propertyRule });
		});
		yield* Console.debug(`Added @property rule for ${varName}`);
	}

	return `var(${varName})`;
});

// ============================================================================
// Convenience Methods
// ============================================================================

export const propertyOf = {
	/**
	 * Create color property
	 * @example
	 * propertyOf.color('#ff0000', { name: '--accent' })
	 */
	color: Effect.fn("propertyOf.color")(function* (
		this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
		initialValue: string,
		options: { name?: string; inherit?: boolean } = {},
	) {
		yield* Console.debug(`Creating color property: ${initialValue}`);

		return yield* property.call(this, {
			name: options.name,
			syntax: "<color>",
			inherits: options.inherit ?? true,
			initialValue,
		});
	}),

	/**
	 * Create length property
	 */
	length: Effect.fn("propertyOf.length")(function* (
		this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
		initialValue: string,
		options: { name?: string; inherit?: boolean } = {},
	) {
		yield* Console.debug(`Creating length property: ${initialValue}`);

		return yield* property.call(this, {
			name: options.name,
			syntax: "<length>",
			inherits: options.inherit ?? true,
			initialValue,
		});
	}),

	/**
	 * Create number property
	 */
	number: Effect.fn("propertyOf.number")(function* (
		this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
		initialValue: number,
		options: { name?: string; inherit?: boolean } = {},
	) {
		yield* Console.debug(`Creating number property: ${initialValue}`);

		return yield* property.call(this, {
			name: options.name,
			syntax: "<number>",
			inherits: options.inherit ?? true,
			initialValue: String(initialValue),
		});
	}),

	/**
	 * Create percentage property
	 */
	percentage: Effect.fn("propertyOf.percentage")(function* (
		this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
		initialValue: string,
		options: { name?: string; inherit?: boolean } = {},
	) {
		yield* Console.debug(`Creating percentage property: ${initialValue}`);

		return yield* property.call(this, {
			name: options.name,
			syntax: "<percentage>",
			inherits: options.inherit ?? true,
			initialValue,
		});
	}),

	/**
	 * Create length-percentage property
	 */
	lengthPercentage: Effect.fn("propertyOf.lengthPercentage")(function* (
		this: { addAsset?: (asset: { type: string; content: string }) => void } | void,
		initialValue: string,
		options: { name?: string; inherit?: boolean } = {},
	) {
		yield* Console.debug(`Creating length-percentage property: ${initialValue}`);

		return yield* property.call(this, {
			name: options.name,
			syntax: "<length-percentage>",
			inherits: options.inherit ?? true,
			initialValue,
		});
	}),
};
