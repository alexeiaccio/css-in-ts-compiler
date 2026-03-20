import { Schema } from "effect";

import { TokenSchema } from "../non-recursive.js";
import { CssColorSchema } from "../non-recursive.js";
import { UrlSchema } from "../non-recursive.js";
import { LengthValueSchema } from "../non-recursive.js";
import { AngleSchema } from "../non-recursive.js";
import { TimeSchema } from "../non-recursive.js";
import { ResolutionSchema } from "../non-recursive.js";
import { AnimationNameSchema } from "../non-recursive.js";

export class EnvironmentVariable extends Schema.Opaque<EnvironmentVariable>()(
	Schema.Struct({
		fallback: Schema.optionalKey(
			Schema.NullOr(Schema.Array(Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue))),
		),
		indices: Schema.optionalKey(Schema.Array(Schema.Number)),
		name: Schema.Unknown,
	}),
) {}

export class Function extends Schema.Opaque<Function>()(
	Schema.Struct({
		arguments: Schema.Array(Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue)),
		name: Schema.Unknown,
	}),
) {}

export class TokenOrValue extends Schema.Opaque<TokenOrValue>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			token: { value: TokenSchema },
			color: { value: CssColorSchema },
			"unresolved-color": { value: Schema.suspend((): Schema.Codec<UnresolvedColor> => UnresolvedColor) },
			url: { value: UrlSchema },
			var: { value: Schema.suspend((): Schema.Codec<Variable> => Variable) },
			env: { value: Schema.suspend((): Schema.Codec<EnvironmentVariable> => EnvironmentVariable) },
			function: { value: Schema.suspend((): Schema.Codec<Function> => Function) },
			length: { value: LengthValueSchema },
			angle: { value: AngleSchema },
			time: { value: TimeSchema },
			resolution: { value: ResolutionSchema },
			"dashed-ident": { value: Schema.String },
			"animation-name": { value: AnimationNameSchema },
		}),
	}),
) {}

export class UnresolvedColor extends Schema.Opaque<UnresolvedColor>()(
	Schema.Struct({
		schema: Schema.TaggedUnion({
			rgb: {
				alpha: Schema.Tuple([
					Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue),
					Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue),
				]),
				b: Schema.Number,
				g: Schema.Number,
				r: Schema.Number,
			},
			hsl: {
				alpha: Schema.Tuple([
					Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue),
					Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue),
				]),
				h: Schema.Number,
				l: Schema.Number,
				s: Schema.Number,
			},
			"light-dark": {
				dark: Schema.Tuple([
					Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue),
					Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue),
				]),
				light: Schema.Tuple([
					Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue),
					Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue),
				]),
			},
		}),
	}),
) {}

export class Variable extends Schema.Opaque<Variable>()(
	Schema.Struct({
		fallback: Schema.optionalKey(
			Schema.NullOr(Schema.Array(Schema.suspend((): Schema.Codec<TokenOrValue> => TokenOrValue))),
		),
		name: Schema.Unknown,
	}),
) {}
