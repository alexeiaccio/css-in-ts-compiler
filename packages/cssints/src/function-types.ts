// The parts of a CSS function call (`calc(t.space.md, "*", 2)`, `lightDark("white", t.color.bg)`) and how the call is
// checked: a math function by the kind of its arguments (which gives the kind of its result), any other against its
// mdn-data grammar, `<rgb()>`, with the call as text. A part is a string, a number or a Typed OM value (a token, a call).
// Parts are joined by the function's separator, and by a space next to an operator (`"+"`, `"-"`, `"*"`, `"/"`). Types only.
import type {
  LengthUnit,
  MatchesValue,
  Sentinel,
  Sentinels,
  Unexpected,
  ValidIn,
} from "@cssints/css-grammar/css";
import type {
  Syntax,
  Token,
  TOKEN_TYPES,
  TokenType,
  ValidSyntax,
} from "@cssints/css-grammar/token";
import type { CSSStyleValue } from "@cssints/css-grammar/values";

type Atom = string | number | CSSStyleValue;
/** One part of a call: a string, a number, a Typed OM value (a token, another call), or an array of those joined by a space (`[t.color.bg, "25%"]`, a colour stop). */
export type Arg = Atom | readonly Atom[];
type Op = "+" | "-" | "*" | "/";
type Text<P> = P extends string
  ? P
  : P extends number
    ? `${P}`
    : P extends CSSStyleValue<infer T>
      ? Sentinel<T>
      : P extends readonly Atom[]
        ? Join<P, " ">
        : never;
type Glue<Prev, H, Sep extends string> = [Prev] extends [Op] ? " " : [H] extends [Op] ? " " : Sep;
type Next<Prev, H, Sep extends string> = [Prev] extends [never] ? "" : Glue<Prev, H, Sep>;
type Join<
  A extends readonly Arg[],
  Sep extends string,
  Acc extends string = "",
  Prev = never,
> = A extends readonly [infer H, ...infer R extends readonly Arg[]]
  ? Join<R, Sep, `${Acc}${Next<Prev, H, Sep>}${Text<H>}`, H>
  : Acc;
type Call<N extends string, Sep extends string, A extends readonly Arg[]> = `${N}(${Join<A, Sep>})`;

// The recognizer does not say where inside a call it stopped (a failed sequence reports its start), so the bad argument is
// found by prefixes: a `var()` stands for any run of values (css.ts "Pending substitution"), so `name(parts so far, var(--x))`
// is a `<name()>` while the parts can still go on (or the call is complete). The first part after which it is not is the bad
// one; when every prefix goes on, the call ends too soon and the last part is where it is said.
type Stop<
  N extends string,
  Sep extends string,
  A extends readonly Arg[],
  Acc extends string = `${N}(`,
  Prev = never,
  I extends 0[] = [],
> = A extends readonly [infer H, ...infer R extends readonly Arg[]]
  ? `${Acc}${Next<Prev, H, Sep>}${Text<H>}` extends infer J extends string
    ? MatchesValue<`<${N}()>`, `${J}${Glue<H, "", Sep>}var(--x))`> extends true
      ? Stop<N, Sep, R, J, H, [...I, 0]>
      : MatchesValue<`<${N}()>`, `${J})`> extends true
        ? Stop<N, Sep, R, J, H, [...I, 0]>
        : [at: `${I["length"]}`, n: [...I, 0]["length"], bad: Text<H>]
    : never
  : [at: `${Dec<I>["length"]}`, n: I["length"], bad: ""];
/**
 * The parameters of a call to function `N` joined by `Sep`: `A` when the call is a valid `<N()>`, else the twin's message,
 * with the position of the argument, on the argument where the text stops matching the grammar.
 */
export type CheckFn<N extends string, Sep extends string, A extends readonly Arg[]> =
  ValidIn<`${N}()`, `<${N}()>`, Call<N, Sep, A>> extends infer V
    ? V extends Call<N, Sep, A>
      ? A
      : A extends readonly []
        ? [value: V]
        : Stop<N, Sep, A> extends [
              infer At extends string,
              infer Pos extends number,
              infer Bad extends string,
            ]
          ? {
              [K in keyof A]: K extends At
                ? `${N}(): ${Unexpected<Bad>} in "${Call<N, Sep, A>}", grammar <${N}()> (${Bad extends "" ? "after " : ""}argument ${Pos})`
                : A[K];
            }
          : never
    : never;
/** `rgb`, `linearGradient`, `lightDark`: a call whose result is a `<N()>`, a part wherever the grammar takes one. */
export type Fn<N extends string, Sep extends string> = <const A extends readonly Arg[]>(
  ...parts: CheckFn<N, Sep, A>
) => CSSStyleValue<N extends "url" | "src" ? "url" : `${N}()`>; // the recognizer reads <url> itself, not <url()>

// ---- math: the kind of each argument, folded with the precedence of CSS (`*` `/` before `+` `-`)
type Known = "length" | "percentage" | "angle" | "time" | "resolution";
type StrKind<S extends string> = S extends `${number}%`
  ? "percentage"
  : S extends `${number}${LengthUnit}`
    ? "length"
    : S extends `${number}${"deg" | "grad" | "rad" | "turn"}`
      ? "angle"
      : S extends `${number}${"s" | "ms"}`
        ? "time"
        : S extends `${number}${"dpi" | "dpcm" | "dppx" | "x"}`
          ? "resolution"
          : S extends `${number}`
            ? "number"
            : S extends "up" | "down" | "nearest" | "to-zero"
              ? "mode"
              : "any";
type TypeKind<T extends string> = [Sentinels] extends [T]
  ? "any"
  : [T] extends ["number" | "integer"]
    ? "number"
    : [T] extends [Known]
      ? T
      : "other";
type KindOf<H> = H extends number
  ? "number"
  : H extends string
    ? StrKind<H>
    : H extends CSSStyleValue<infer T>
      ? TypeKind<T>
      : "any";
type Show<K> = [K] extends ["percentage"]
  ? "percentage"
  : Exclude<K, "percentage"> extends infer B extends string
    ? "percentage" extends K
      ? `${B}-percentage`
      : B
    : never;
type Err<I extends 0[], M extends string> = [at: `${I["length"]}`, message: M];
type IsErr<R> = [R] extends [readonly [string, string]] ? true : false;
type Dec<I extends 0[]> = I extends [0, ...infer T extends 0[]] ? T : [];

type AddK<P, K, I extends 0[]> = [P] extends ["any"]
  ? K
  : [K] extends ["any"]
    ? P
    : [P] extends [K]
      ? [K] extends [P]
        ? P
        : Mix<P, K, I>
      : Mix<P, K, I>;
// a percentage with a length or an angle: the percent hint (`length-percentage`)
type Mix<P, K, I extends 0[]> = [Exclude<P | K, "percentage">] extends ["length"] | ["angle"]
  ? "percentage" extends P | K
    ? P | K
    : Err<I, `cannot add ${Show<P>} and ${Show<K>}`>
  : Err<I, `cannot add ${Show<P>} and ${Show<K>}`>;
type MulK<P, K, I extends 0[]> = [P] extends ["any"]
  ? [K] extends ["number"]
    ? "any"
    : K
  : [K] extends ["any"]
    ? [P] extends ["number"]
      ? "any"
      : P
    : [P] extends ["number"]
      ? K
      : [K] extends ["number"]
        ? P
        : Err<I, `cannot multiply ${Show<P>} by ${Show<K>}`>;
type DivK<P, K, I extends 0[]> = [P] extends ["any"]
  ? "any"
  : [K] extends ["any" | "number"]
    ? P
    : [P] extends [K]
      ? [K] extends [P]
        ? "number"
        : Err<I, `cannot divide ${Show<P>} by ${Show<K>}`>
      : Err<I, `cannot divide ${Show<P>} by ${Show<K>}`>;
// the terms of a group are added: its sum so far, then its current product
type Fold<Sum, Prod, I extends 0[]> = [Sum] extends [never] ? Prod : AddK<Sum, Prod, I>;
type Join2<Acc, G, I extends 0[]> = [Acc] extends [never] ? G : AddK<Acc, G, I>;
// operands with no operator between them are separate arguments, whose kinds are added too (`min`, `clamp`, `mod`)
type Walk<
  A extends readonly Arg[],
  Acc,
  Sum,
  Prod,
  Pend extends string,
  I extends 0[] = [],
> = A extends readonly [infer H, ...infer R extends readonly Arg[]]
  ? [H] extends [Op]
    ? Walk<R, Acc, Sum, Prod, H, [...I, 0]>
    : KindOf<H> extends infer k
      ? [k] extends ["mode"]
        ? Walk<R, Acc, Sum, Prod, Pend, [...I, 0]>
        : [k] extends ["other"]
          ? Err<I, `${Text<H>} is not a number or a dimension`>
          : [Prod] extends [never]
            ? Walk<R, Acc, Sum, k, "", [...I, 0]>
            : Step<R, Acc, Sum, Prod, Pend, k, I>
      : never
  : [Prod] extends [never]
    ? Acc
    : Join2<Acc, Fold<Sum, Prod, Dec<I>>, Dec<I>>;
type Step<
  R extends readonly Arg[],
  Acc,
  Sum,
  Prod,
  Pend extends string,
  k,
  I extends 0[],
> = Pend extends "*"
  ? MulK<Prod, k, I> extends infer X
    ? IsErr<X> extends true
      ? X
      : Walk<R, Acc, Sum, X, "", [...I, 0]>
    : never
  : Pend extends "/"
    ? DivK<Prod, k, I> extends infer X
      ? IsErr<X> extends true
        ? X
        : Walk<R, Acc, Sum, X, "", [...I, 0]>
      : never
    : Pend extends "+" | "-"
      ? Fold<Sum, Prod, I> extends infer X
        ? IsErr<X> extends true
          ? X
          : Walk<R, Acc, X, k, "", [...I, 0]>
        : never
      : Join2<Acc, Fold<Sum, Prod, I>, I> extends infer X
        ? IsErr<X> extends true
          ? X
          : Walk<R, X, never, k, "", [...I, 0]>
        : never;

/** The parameters of a math call: `A`, or the message of the first operation that mixes kinds, on its argument. */
export type CheckMath<A extends readonly Arg[]> =
  Walk<A, never, never, never, ""> extends infer R
    ? R extends readonly [infer At extends string, infer M extends string]
      ? { [K in keyof A]: K extends At ? M : A[K] }
      : A
    : never;
type Result<C extends string, A extends readonly Arg[]> = C extends "same"
  ? Walk<A, never, never, never, ""> extends infer R
    ? [R] extends [never]
      ? Sentinels
      : IsErr<R> extends true
        ? Sentinels
        : [R] extends ["any"]
          ? Sentinels
          : R & string
    : never
  : C;
/**
 * A math function: its result is of the kind its arguments have (`same`: `min`, `calc`, `clamp`), or a number or an angle.
 * `calc(t.space.md, "*", 2)` is a length, `calc(t.space.md, "+", t.time.fast)` is an error on `t.time.fast`.
 */
export type MathCall<C extends "same" | "number" | "angle"> = <const A extends readonly Arg[]>(
  ...parts: CheckMath<A>
) => CSSStyleValue<Result<C, A>>;

/**
 * `var(token, fallback?)`: the token's own type, the fallback checked as a value of it (a string, a Typed OM value of its type, or
 * a call, which the build checks).
 * The first argument is a token, never a name.
 */
export type VarCall = <const K extends TokenType, const F extends string = never>(
  token: Token<K, boolean, string>,
  fallback?:
    | ValidSyntax<Syntax<K>, F>
    | CSSStyleValue<(typeof TOKEN_TYPES)[K]["sentinels"][number] | `${string}()`>,
) => CSSStyleValue<(typeof TOKEN_TYPES)[K]["sentinels"][number]>;
