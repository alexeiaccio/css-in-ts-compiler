import { Consume, Matches, Parse, Stuck, Unexpected } from "./css.mjs";
import { CSSStyleValue } from "./values.mjs";
//#region src/token.d.ts
/**
 * Per token type, by the name of `token.<name>`:
 * - `syntax`: the `@property` syntax, `<syntax>`, checked by the twin and by `ValidSyntax`;
 * - `sentinels`: the typed-value types the token stands for in a property value (`⟨length⟩`, api-typed.ts);
 * - `probes`: literals of the type that a build-time check puts in place of the token (one per sentinel), since the
 *   recognizer reads text and a token is `var(--name)`.
 */
export declare const TOKEN_TYPES: {
  readonly color: {
    readonly syntax: "color";
    readonly sentinels: readonly ["color"];
    readonly probes: readonly ["red"];
  };
  readonly length: {
    readonly syntax: "length";
    readonly sentinels: readonly ["length"];
    readonly probes: readonly ["1px"];
  };
  readonly percentage: {
    readonly syntax: "percentage";
    readonly sentinels: readonly ["percentage"];
    readonly probes: readonly ["1%"];
  };
  readonly lengthPercentage: {
    readonly syntax: "length-percentage";
    readonly sentinels: readonly ["length", "percentage"];
    readonly probes: readonly ["1px", "1%"];
  };
  readonly number: {
    readonly syntax: "number";
    readonly sentinels: readonly ["number"];
    readonly probes: readonly ["1"];
  };
  readonly integer: {
    readonly syntax: "integer";
    readonly sentinels: readonly ["integer"];
    readonly probes: readonly ["1"];
  };
  readonly angle: {
    readonly syntax: "angle";
    readonly sentinels: readonly ["angle"];
    readonly probes: readonly ["1deg"];
  };
  readonly time: {
    readonly syntax: "time";
    readonly sentinels: readonly ["time"];
    readonly probes: readonly ["1s"];
  };
  readonly customIdent: {
    readonly syntax: "custom-ident";
    readonly sentinels: readonly ["custom-ident"];
    readonly probes: readonly ["x"];
  };
  readonly resolution: {
    readonly syntax: "resolution";
    readonly sentinels: readonly ["resolution"];
    readonly probes: readonly ["1dppx"];
  };
  readonly url: {
    readonly syntax: "url";
    readonly sentinels: readonly ["url"];
    readonly probes: readonly ["url(x)"];
  };
  readonly image: {
    readonly syntax: "image";
    readonly sentinels: readonly ["image"];
    readonly probes: readonly ["linear-gradient(red, blue)"];
  };
  readonly transformList: {
    readonly syntax: "transform-list";
    readonly sentinels: readonly ["transform-list"];
    readonly probes: readonly ["translateX(1px)"];
  };
};
export type TokenType = keyof typeof TOKEN_TYPES;
/**
 * DTCG `$type` to token type (createTokens, docs/API.md "Themes"). `fontWeight` is a number: its keywords become numbers.
 * The other DTCG types (`fontFamily`, `cubicBezier`, `strokeStyle`, `border`, `transition`, `shadow`, `gradient`,
 * `typography`) have no `@property` syntax and are an error.
 */
export declare const DTCG_TYPES: {
  readonly color: "color";
  readonly dimension: "length";
  readonly number: "number";
  readonly duration: "time";
  readonly fontWeight: "number";
};
export type DtcgType = keyof typeof DTCG_TYPES;
export type Syntax<K extends TokenType> = (typeof TOKEN_TYPES)[K]["syntax"];
type Trim<S extends string> = S extends ` ${infer R}` ? Trim<R> : S;
/** The value, or a message naming the bad token, like `Valid` for a property. */
export type ValidSyntax<K extends string, S extends string> = Matches<`<${K}>`, S> extends true ? S : S extends string ? `${K}: ${Unexpected<Stuck<Trim<S> | Consume<Parse<`<${K}>`>, Trim<S>>>>} in "${S}", grammar <${K}>` : never;
/** A token: a Typed OM value of its type whose text is `var(--name)`. `Settable` is whether it has a name. */
export interface Token<K extends TokenType = TokenType, Settable extends boolean = boolean> extends CSSStyleValue<(typeof TOKEN_TYPES)[K]["sentinels"][number]> {
  readonly "~token": K;
  readonly "~settable": Settable;
}
/** `--name`, and whether the variable inherits (default true). */
export interface TokenName {
  var: string;
  inherit?: boolean;
}
/** An inline style: what `style()` and `token.set()` give, for a `style` prop. */
export type StyleObject = Record<string, string>;
/** `token.<type>(initial, name?)`: with a name the token can be set, without one it is private. */
export type TokenFn<K extends TokenType> = <const I extends string, const N extends string | TokenName | undefined = undefined>(initial: ValidSyntax<Syntax<K>, I>, name?: N) => Token<K, [N] extends [undefined] ? false : true>;
/** `token.set(token, value)`: a style object with one custom property. A private token cannot be set. */
export type TokenSetFn = <const K extends TokenType, const V extends string>(token: Token<K, true>, value: ValidSyntax<Syntax<K>, V>) => StyleObject;
//#endregion