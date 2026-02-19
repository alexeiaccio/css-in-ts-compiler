import { identity, Layer, ManagedRuntime, Match, SchemaGetter } from "effect";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

export const Globals = Schema.Union([
	Schema.Literal("inherit"),
	Schema.Literal("unset"),
	// Schema.Literal("initial"),
	// Schema.Literal("revert"),
	// Schema.Literal("revert-layer"),
	// Schema.Literal("revert-rule"),
]);

export const None = Schema.Literal("none");
export const Auto = Schema.Literal("auto");

const REM = 16;

export const Px = Schema.Union([Schema.Finite, Schema.TemplateLiteral([Schema.Finite])]).pipe(
	Schema.encodeTo(Schema.TemplateLiteral([Schema.FiniteFromString, "rem"]), {
		encode: SchemaGetter.transform((value) => {
			const result = Match.value(value).pipe(
				Match.when(Match.number, (value) => `${value / REM}rem` as const),
				Match.when(Match.string, (value) => `${Number.parseFloat(value) / REM}rem` as const),
				Match.exhaustive,
			);

			return result;
		}),
		decode: SchemaGetter.transform((value) => {
			return parseFloat(value.replace("rem", "")) * REM;
		}),
	}),
);
export type Px = typeof Px.Type;
export const Rem = Schema.Union([Schema.Finite, Schema.TemplateLiteral([Schema.Finite])]).pipe(
	Schema.encodeTo(Schema.TemplateLiteral([Schema.FiniteFromString, "rem"]), {
		encode: SchemaGetter.transform((value) => {
			return `${value}rem` as const;
		}),
		decode: SchemaGetter.transform((value) => {
			return parseFloat(value.replace("rem", ""));
		}),
	}),
);
export type Rem = typeof Rem.Type;

export const px = Schema.encodeSync(Px);
export const rem = Schema.encodeSync(Rem);

export const Length = Schema.Union([
	Rem,
	Px,
	Schema.TemplateLiteral([Schema.FiniteFromString, "rem"]),
	Schema.TemplateLiteral([Schema.FiniteFromString, "px"]),
]).pipe(
	Schema.encodeTo(Schema.TemplateLiteral([Schema.FiniteFromString, "rem"]), {
		encode: SchemaGetter.transform((value) => {
			if (String(value).includes("px")) {
				return px(Number.parseFloat(value.replace("px", "")));
			}
			if (String(value).includes("rem")) {
				return rem(Number.parseFloat(value.replace("rem", "")));
			}
			return rem(Number.parseFloat(value));
		}),
		decode: SchemaGetter.transform(identity),
	}),
);
export type Length = Schema.toType<typeof Length>;

export const length = Schema.encodeSync(Length);

// TODO: make it function
export const Padding = Schema.Union([Length, Globals, None]).pipe(
	Schema.encodeTo(Schema.TemplateLiteral(["padding: ", Schema.Union([Length, Globals, None])]), {
		encode: SchemaGetter.transform((value) => {
			if (value === "none") {
				return "padding: none" as const;
			}
			if (value === "unset") {
				return "padding: unset" as const;
			}
			if (value === "inherit") {
				return "padding: inherit" as const;
			}
			return `padding: ${value};` as const;
		}),
		decode: SchemaGetter.passthrough,
	}),
);
export type Padding = Schema.toType<typeof Padding>;

export const padding = Schema.encodeSync(Padding);

const runtime = ManagedRuntime.make(Layer.empty);

const makeCn = (...value: unknown[]) => Effect.succeed(() => value.join(" "));
export const cn = (...value: unknown[]) =>
	runtime.runSync(
		Effect.gen(function* () {
			return yield* makeCn(...value);
		}),
	)();

// E.runSync(cn(padding(10)));

if (import.meta.vitest) {
	const { it, expect, describe } = import.meta.vitest;
	describe("effect", () => {
		it("works", () => {
			const px_0_4 = px(0.4);
			expect(cn(px_0_4)).toEqual("0.025rem");
			const px_0 = px("0");
			expect(cn(px_0)).toEqual("0rem");

			const rem_2 = rem(2);
			expect(cn(rem_2)).toEqual("2rem");
			const rem_1_666 = rem("1.666");
			expect(cn(rem_1_666)).toEqual("1.666rem");

			const length_20 = length(20);
			expect(cn(length_20)).toEqual("20rem");
			const length_10px = length("10px");
			expect(cn(length_10px)).toEqual("0.625rem");
			const length_3rem = length("3rem");
			expect(cn(length_3rem)).toEqual("3rem");

			const padding_10 = padding(10);
			expect(cn(padding_10)).toMatchInlineSnapshot(``);
		});
	});
}
