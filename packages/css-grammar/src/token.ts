// Tokens (docs/API.md "Tokens"): the types `token.<type>` exists for, and the type-level check of an initial value.
// `TOKEN_TYPES` is also what the build-time check reads (cssints token.ts). Types only, apart from that table.
import type { Consume, Matches, Parse, Stuck, Unexpected } from "./css";
import type { CSSStyleValue } from "./values";

/**
 * Per token type, by the name of `token.<name>`:
 * - `syntax`: the `@property` syntax, `<syntax>`, checked by the twin and by `ValidSyntax`;
 * - `sentinels`: the typed-value types the token stands for in a property value (`⟨length⟩`, api-typed.ts);
 * - `probes`: literals of the type that a build-time check puts in place of the token (one per sentinel), since the
 *   recognizer reads text and a token is `var(--name)`.
 */
export const TOKEN_TYPES = {
  color: { syntax: "color", sentinels: ["color"], probes: ["red"] },
  length: { syntax: "length", sentinels: ["length"], probes: ["1px"] },
  percentage: { syntax: "percentage", sentinels: ["percentage"], probes: ["1%"] },
  lengthPercentage: {
    syntax: "length-percentage",
    sentinels: ["length", "percentage"],
    probes: ["1px", "1%"],
  },
  number: { syntax: "number", sentinels: ["number"], probes: ["1"] },
  integer: { syntax: "integer", sentinels: ["integer"], probes: ["1"] },
  angle: { syntax: "angle", sentinels: ["angle"], probes: ["1deg"] },
  time: { syntax: "time", sentinels: ["time"], probes: ["1s"] },
  customIdent: { syntax: "custom-ident", sentinels: ["custom-ident"], probes: ["x"] },
  resolution: { syntax: "resolution", sentinels: ["resolution"], probes: ["1dppx"] },
  url: { syntax: "url", sentinels: ["url"], probes: ["url(x)"] },
  // a gradient, not `url(x)`: an image token does not fit a `<url>` position at build time either
  image: { syntax: "image", sentinels: ["image"], probes: ["linear-gradient(red, blue)"] },
  transformList: {
    syntax: "transform-list",
    sentinels: ["transform-list"],
    probes: ["translateX(1px)"],
  },
} as const;
export type TokenType = keyof typeof TOKEN_TYPES;

/**
 * DTCG `$type` to token type (createTokens, docs/API.md "Themes"). `fontWeight` is a number: its keywords become numbers.
 * The other DTCG types (`fontFamily`, `cubicBezier`, `strokeStyle`, `border`, `transition`, `shadow`, `gradient`,
 * `typography`) have no `@property` syntax and are an error.
 */
export const DTCG_TYPES = {
  color: "color",
  dimension: "length",
  number: "number",
  duration: "time",
  fontWeight: "number",
} as const satisfies Record<string, TokenType>;
export type DtcgType = keyof typeof DTCG_TYPES;
export type Syntax<K extends TokenType> = (typeof TOKEN_TYPES)[K]["syntax"];

type Trim<S extends string> = S extends ` ${infer R}` ? Trim<R> : S;
/** The value, or a message naming the bad token, like `Valid` for a property. */
export type ValidSyntax<K extends string, S extends string> =
  Matches<`<${K}>`, S> extends true
    ? S
    : S extends string
      ? `${K}: ${Unexpected<Stuck<Trim<S> | Consume<Parse<`<${K}>`>, Trim<S>>>>} in "${S}", grammar <${K}>`
      : never;

/**
 * A token: a Typed OM value of its type whose text is `var(--name)`. `Settable` is whether it has a name. `V` is the value of
 * the definition as text, inferred by `createTokens` (`"#545434"`, `"{color.base}"` for an alias), `string` where nothing
 * says; a covariant phantom, so a token of any `V` is a `Token<K, S>`.
 */
export interface Token<
  K extends TokenType = TokenType,
  Settable extends boolean = boolean,
  V extends string = string,
> extends CSSStyleValue<(typeof TOKEN_TYPES)[K]["sentinels"][number]> {
  readonly "~token": K;
  readonly "~settable": Settable;
  readonly "~value": V;
}
/** `--name`, and whether the variable inherits (default true). */
export interface TokenName {
  var: string;
  inherit?: boolean;
}
/** An inline style: what `style()` and `token.set()` give, for a `style` prop. */
export type StyleObject = Record<string, string>;
/** `token.<type>(initial, name?)`: with a name the token can be set, without one it is private. */
export type TokenFn<K extends TokenType> = <
  const I extends string,
  const N extends string | TokenName | undefined = undefined,
>(
  initial: ValidSyntax<Syntax<K>, I>,
  name?: N,
) => Token<K, [N] extends [undefined] ? false : true>;
/** `token.set(token, value)`: a style object with one custom property. A private token cannot be set. */
export type TokenSetFn = <const K extends TokenType, const V extends string>(
  token: Token<K, true>,
  value: ValidSyntax<Syntax<K>, V>,
) => StyleObject;
