// DRAFT "cssints/plugin" (design C: tokens and themes are the vocabulary; `plugin()` is a thin wrapper).
//
// A plugin module imports only this. Everything it builds goes through the `css` that a body is handed: the eval-time
// twin of what a user writes (`css.outline(...)`, `css.createGlobalTheme(...)`, `css.check`, `css.layers(...)`), so
// reading a plugin is reading user code. What `plugin()` adds: a namespace, delivery by use, typed setters, and the
// rules of a kernel written as styles.
import type { Syntax, Token, TokenType } from "@cssints/css-grammar/token";
import type * as Cssints from "cssints";
import type { BcdKey, Conflict, Decl, Method, Runtime } from "cssints/internal/author-types";
import type { CheckIn, Part, Style } from "cssints/internal/parts";

export type { BcdKey, Conflict, Decl, Method, Runtime, Part, Style };

/** The library a body is handed: all of "cssints", at build time, with the call site of the member as its `at`. */
export type Css = typeof Cssints;

/** The rule behind a marker class. Styles are checked like a user's (tokens are typed values); `css` is verbatim CSS. */
export type KernelSource =
  | ((css: Css) => Style | readonly Style[])
  | { css: string; atProperty?: string; requires?: BcdKey[] };

export interface PluginOptions {
  /** Delivered when a target lacks a polyfilled feature (today's `Runtime`); keyed by the plugin's name. */
  runtime?: Runtime;
}

export interface ContextOptions<M, S extends string> {
  /** The marker class (default `_<name>`). */
  marker?: string;
  /** The one static rule on the marker. */
  kernel?: KernelSource;
  /**
   * A build error when one `cn()` holds the marker and a property that the kernel sets (its longhands too). Default:
   * the properties of a kernel written as styles; `false` for none, `{ props, message }` to say it by hand.
   */
  conflicts?: false | Conflict;
  /** Setters where a lone number is a step of the spacing scale (0.25rem), as in `padding`. */
  spacing?: readonly S[];
  /** Methods that are not a setter of a token (a lone `ink()`, a grammar with `spacing`): today's `method()`. */
  methods?: M;
}

type Excluded<X extends string> = string extends X ? never : X;
/**
 * The chain of a context. `R` maps each method to what it is: a token type (a setter, its grammar the token's type), a
 * `[type, true]` pair (the same, a lone number is a spacing step), or a `Method`; each is used once.
 */
export type Chain<N extends string, R> = Style & {
  readonly [K in keyof R & string]: R[K] extends Method<infer G, infer Sp, infer X>
    ? string extends G
      ? (...parts: [`${N}.${K}: the grammar is not a literal type: write it as const`]) => never
      : G extends ""
        ? () => Chain<N, Omit<R, K | Excluded<X>>>
        : <const A extends readonly Part[]>(
            ...parts: CheckIn<`${N}.${K}`, G, boolean extends Sp ? false : Sp, A>
          ) => Chain<N, Omit<R, K | Excluded<X>>>
    : R[K] extends TokenType
      ? <const A extends readonly Part[]>(
          ...parts: CheckIn<`${N}.${K}`, `<${Syntax<R[K]>}>`, false, A>
        ) => Chain<N, Omit<R, K>>
      : R[K] extends readonly [infer Kd extends TokenType, true]
        ? <const A extends readonly Part[]>(
            ...parts: CheckIn<`${N}.${K}`, `<${Syntax<Kd>}>`, true, A>
          ) => Chain<N, Omit<R, K>>
        : never;
};

/** The token type of each leaf, with `[type, true]` for the ones in `S`. */
type Kinds<TS, S extends string> = {
  readonly [K in keyof TS]: TS[K] extends Token<infer Kd, boolean>
    ? K extends S
      ? readonly [Kd, true]
      : Kd
    : never;
};
/** A flat set of tokens: every leaf one method. */
type Leaves = { readonly [name: string]: Token<TokenType, true> };

export interface Plugin<N extends string> {
  readonly name: N;
  /**
   * `createTokens`, in the plugin's namespace: `--<name>-<path>`, `@property` with `inherits: false`. The tokens are
   * declared when a member that uses them is used (a plugin module has no call site of its own); export the set to
   * let users theme it (`createGlobalTheme(ringTokens, ".thick", { width: "4px" })`) and check its colours.
   */
  readonly tokens: typeof Cssints.createTokens;
  /** `token.<type>(initial, name)`, in the plugin's namespace (a `url` or any single token that `tokens` has no `$type` for). */
  readonly token: typeof Cssints.token;
  /** A kernel as a style: `cn(kernel, …)` in a body. `marker` is its fixed class (`_i`). */
  kernel(marker: string, source: KernelSource): Style;
  /** `token.set` for a body: the declaration `--<name>-x: value` as a style; the value is checked when it is built. */
  set<const K extends TokenType>(token: Token<K, true>, value: string): Style;
  /**
   * `() => chain` like `flex()`: the call is the marker and the kernel, and every leaf of `tokens` is a setter (the
   * token's default is the default of the rule: `@property`'s initial value), checked by the type of the token.
   */
  context<
    const TS extends Leaves,
    const M extends Record<string, Method<any, any, any>> = {},
    const S extends keyof TS & string = never,
  >(
    tokens: TS,
    options?: ContextOptions<M, S>,
  ): () => Chain<N, Omit<Kinds<TS, S>, keyof M> & M>;
  /**
   * A function of a grammar-typed value (`dot("small")`): `run` gets it as text.
   */
  member<const G extends string, R extends Style | void>(
    grammar: G,
    run: (css: Css, value: string) => R,
  ): <const A extends readonly Part[]>(...parts: CheckIn<N, G, false, A>) => R;
  /**
   * A function of anything (structured arguments): the signature of `run`, less its first parameter, is the
   * signature users see, generics included. It returns a style (`cn(...)`), or nothing for a rule with no class.
   */
  member<const A extends readonly unknown[], R extends Style | void>(
    run: (css: Css, ...args: A) => R,
  ): (...args: A) => R;
}

/**
 * Registers a plugin by `name`: its namespace for custom properties, the marker, the runtime, and the label of its errors.
 * A second module that claims the name is a build error; the same module run again (HMR) is not.
 */
export declare function plugin<const N extends string>(name: N, options?: PluginOptions): Plugin<N>;

/** Unchanged: a typed property of your own, and a value function (see "Functions"). */
export declare function property<const N extends string, const G extends string>(
  name: N,
  grammar: G,
  emit?: (value: string) => Decl[],
): <const A extends readonly Part[]>(...parts: CheckIn<N, G, false, A>) => Style;
/** Today's `method`, for `methods` of a context. */
export declare const method: <
  const G extends string,
  const Sp extends boolean = false,
  const X extends string = never,
>(def: {
  grammar: G;
  spacing?: Sp;
  excludes?: readonly X[];
  emit: (value: string) => Decl[];
}) => Method<G, Sp, X>;
