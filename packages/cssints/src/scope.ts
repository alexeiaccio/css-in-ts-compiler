// "cssints/plugin" `scope()`: `scope("name", table).build(impl).export()`. A plugin is a table of entries (syntax aliases,
// kernels, globals, runtimes, conflicts, token sets, embedded scopes, chain, call and value members); its members are typed
// from the table, and what it declares is namespaced by the scope's name. This file is what TypeScript reads of
// "cssints/plugin" (with author.ts), so it imports nothing that runs: the signatures are here and are the only ones; the
// bodies hand the call to the engine (scope-engine.ts), which macro.ts registers when the library loads.
//
// Build time only (Node, the Module Runner): in user code a member returns a class string, so the types say `Style`.
import type { Grammar, TokenType } from "@cssints/css-grammar/token";
import type { ValidSelector } from "@cssints/css-grammar/query";
import type { CSSStyleValue } from "@cssints/css-grammar/values";

import type { BcdKey, Decl } from "./author-types.ts";
import type { CheckIn, Part, Style } from "./parts.ts";
import type { CheckOverrides } from "./theme-types.ts";
import type * as Cssints from "./types.ts";

export type { Part, Style };
export type { BcdKey, Decl };

// ───────────────────────────── the entries of a table ─────────────────────────────

/** A selector of `nest()`: one with `&`, the kernel's class (`& > *`, `& p`, `:root:has(&)`, `.x &`); the build reads the rest. */
export type NestSelector<S extends string> = S extends `${string}&${string}`
  ? S
  : `nest(): "${S}" has no &`;
/** What only a kernel written as styles has, besides all of "cssints". */
export interface KernelCss {
  /**
   * `nest("& > *")(flexGrow(1))`: styles under a selector around the kernel's class (`._k > *`, `:root:has(._k)`). A
   * condition inside applies to its subject (`& > *:hover`), one around it to the element (`._k:hover > *`,
   * `:root:has(._k:hover)`). One condition. When the subject is another element (`&` not in the last compound), what it
   * sets is not the element's, so a member's derived conflicts leave it out; `.x &` is the element's.
   */
  nest: <const S extends string>(selector: NestSelector<S>) => Cssints.Wrap;
  /**
   * `vars({ "--_gap": "1rem" })`: custom properties on the element (`--_x` is `--<scope>-x`), values not checked. A
   * `keyframes()` or `positionTry()` name is a value too: its rule goes with the kernel. Not part of derived conflicts.
   */
  vars: (set: { readonly [name: `--${string}`]: string | number | CSSStyleValue }) => Style;
}
/** The `css` a kernel written as styles is handed: all of "cssints", as user code has it, and `nest` and `vars`. */
export type Css = typeof Cssints & KernelCss;

/**
 * A kernel: global CSS printed once, bound to a class. `&` stands for the class the engine mints for it (`&(mod.key)`: the
 * class of the kernel `key` of an embedded scope `mod`), `--_x` for the custom property `--<scope>-x`. `css` is verbatim
 * CSS, or styles (`(css) => css.outline("var(--_w)", "solid")`: declarations checked like a user's, printed as `&{...}`).
 */
export interface KernelDef {
  css: string | ((css: Css) => Style | readonly Style[]);
  atProperty?: string;
  requires?: (BcdKey | { key: BcdKey; exact: true })[];
}
/** A static global rule; `layer` is a top-level layer that `layers` declares (a contract's name: never namespaced). */
export interface GlobalDef {
  rule: string;
  layer?: string;
}
/** Top-level layers to declare, in order: after the engine's layers, or with `before: true` before them (below every class). */
export interface LayersDef {
  layers: readonly string[];
  before?: boolean;
}
export interface ParentVar {
  marker: "&";
  read: `--_${string}`;
  write: `--_${string}`;
  watch?: `--_${string}`;
}
/** The browser half, delivered when a target lacks a polyfilled feature (`virtual:cssints/runtime/<scope>.<entry>`); `&` is the marker of the member's first kernel. */
export interface RuntimeDef {
  polyfills: BcdKey[];
  parentVars?: ParentVar[];
  css?: string;
  /** A module specifier the app resolves (a package subpath, `"@cssints/balance/runtime"`): imported when a target lacks a polyfilled feature. */
  script?: string;
}
/** A build error when one `cn()` holds the member's marker and a property listed here (a name, or a pattern). */
export interface ConflictDef {
  props: (string | RegExp)[];
  message: string;
}
/** A token set the scope owns: its paths become syntax aliases (`<brand.color.accent>` is the token's type). */
export interface TokensDef {
  tokens: object;
}

/** One method of a chain. `args: ""` takes no value; a lone number is a spacing step with `spacing`. */
export interface MethodDef<
  G extends string = string,
  Sp extends boolean = boolean,
  X extends string = string,
> {
  readonly args: G;
  readonly spacing?: Sp;
  readonly excludes?: readonly X[];
  readonly emit: (value: string) => Decl[];
}

declare const typed: unique symbol;
/** An argument whose type is TypeScript's, not CSS's (`arg<"home" | "star">()`); the member's `build` checks it at build time. */
export interface Typed<T> {
  readonly [typed]: T;
}
/** `arg<T>()`: one value of the TypeScript type `T`. */
export const arg = <T>(): Typed<T> => ({ "~arg": 1 }) as never;

/** One argument: a grammar (aliases of the table allowed), `"$tokens"` (a token set), `"$overrides"` (values for the paths of the `$tokens` before it), `"$selector"` (a CSS selector list) or `arg<T>()`. */
export type Leaf = string | Typed<unknown>;
/** An object argument of named leaves (`"key?"` is optional). */
export interface RecordDef {
  readonly [key: string]: Leaf;
}
/**
 * What a call takes: a grammar (the parts, joined by a space, as a property takes them), `arg<T>()`, or a tuple of
 * positional arguments, each a `Leaf` or one `RecordDef` (an object; it may be left out when all its keys are optional).
 */
export type ArgsDef = Leaf | readonly (Leaf | RecordDef)[];

/** What a member's build gives: declarations, and what else it needs by name (`uses`), globals, themes and layers. */
export interface Made {
  decls?: Decl[];
  /** Entries of the table (kernels, globals, layers, runtimes, conflicts) chosen by this call; `module.entry` for an embedded scope. */
  uses?: readonly string[];
  /** A rule that is not a class: identified by its content, forgotten with the file that made it. */
  globals?: { css: string; layer?: string }[];
  /** As `createGlobalTheme(tokens, selector, overrides, { layer, scope })`: registered like any theme. */
  themes?: {
    tokens: object;
    overrides: object;
    selector: string;
    layer?: string;
    scope?: string;
  }[];
  /** Top-level layers to declare, in order: a list, printed after the engine's layers, or `{ layers, before: true }`. */
  layers?: readonly string[] | LayersDef;
}

export interface ChainDef {
  chain: { readonly [method: string]: MethodDef };
  uses?: readonly string[];
  /** Every style of the member carries the group marker `_g-<scope>`, which `within(state, "<scope>")` reads. */
  group?: true;
}
/** A member that takes arguments and gives declarations: its function is the entry of the same name in `.build()`. */
export interface CallDef {
  args: ArgsDef;
  uses?: readonly string[];
  /** Every style of the member carries the group marker `_g-<scope>`, which `within(state, "<scope>")` reads. */
  group?: true;
}
/**
 * A member computed at build time into a value. `value` gets the arguments in an array: a grammar's parts as text, one by
 * one; a tuple's arguments or `arg<T>()` as `build` would, which needs `fn({ args, value })` to type them. `label` names
 * the member in its errors (the key by default).
 */
export interface ValueDef {
  args: ArgsDef;
  // a method: what `fn()` gives (`value(args: never)`) fits it
  value(parts: string[]): string | CSSStyleValue;
  label?: string;
}
/**
 * A value member whose `args` is a tuple or `arg<T>()`: `value` gets the arguments as a call member's `build` does. A
 * table cannot type `value` from the `args` beside it (as `build()` does for call members); this call can.
 */
export const fn = <
  const D extends ArgsDef,
  R extends string | CSSStyleValue,
  const L extends string = never,
>(def: {
  args: D;
  label?: L;
  value: (args: Params<D>) => R;
}): { args: D; label?: L; value(args: never): R } => def;
export interface ModuleLike {
  readonly "~scope": string;
  readonly "~table": object;
  readonly "~aliases": object;
  readonly "~usable": string;
}
export type Entry =
  | string
  | ModuleLike
  | ChainDef
  | CallDef
  | ValueDef
  | KernelDef
  | GlobalDef
  | LayersDef
  | RuntimeDef
  | ConflictDef
  | TokensDef;
export interface Table {
  readonly [key: string]: Entry;
}

// ───────────────────────────── kinds ─────────────────────────────

type Kind<K, V> = V extends string
  ? K extends `-${string}`
    ? "prop"
    : "alias"
  : V extends ModuleLike
    ? "module"
    : V extends { chain: unknown }
      ? "chain"
      : V extends { args: unknown; value: unknown }
        ? "value"
        : V extends { args: unknown }
          ? "call"
          : V extends { tokens: unknown }
            ? "tokens"
            : V extends { polyfills: unknown }
              ? "runtime"
              : V extends { props: unknown }
                ? "conflicts"
                : V extends { rule: unknown }
                  ? "global"
                  : V extends { layers: unknown }
                    ? "layers"
                    : V extends { css: unknown }
                      ? "kernel"
                      : never;
type Strip<K> = K extends `#${infer R}` ? R : K;
type Private<K> = K extends `#${string}` ? true : false;
type Usable = "kernel" | "global" | "layers" | "runtime" | "conflicts";

// ───────────────────────────── aliases: the local syntax names ─────────────────────────────

type Camel<S extends string> = S extends `-${infer H}`
  ? Camel<H>
  : S extends `${infer A}-${infer B}`
    ? `${A}${Capitalize<Camel<B>>}`
    : S;

/** `<name>` of the table in place, as a group; what is not an alias of the table is left to mdn. The runtime `expand` does the same. */
export type Expand<G extends string, A, D extends 0[] = []> = D["length"] extends 6
  ? G
  : G extends `${infer Pre}<${infer N}>${infer Post}`
    ? N extends keyof A
      ? A[N] extends infer S extends string
        ? `${Pre}[ ${Expand<S, A, [...D, 0]>} ]${Expand<Post, A, D>}`
        : G
      : `${Pre}<${N}>${Expand<Post, A, D>}`
    : G;

// The aliases written in a table, by the name a grammar uses (`#id` is `<id>`).
type Own<T> = {
  [K in keyof T & string as Kind<K, T[K]> extends "alias" ? Strip<K> : never]: T[K];
};
type Resolved<A> = { [N in keyof A]: A[N] extends string ? Expand<A[N], A> : never };
// A token set's paths: the syntax of each token.
type Paths<X, P extends string = ""> = {
  [K in keyof X & string]: X[K] extends { readonly "~token": infer Kd extends TokenType }
    ? { [Q in `${P}${K}`]: Grammar<Kd> }
    : Paths<X[K], `${P}${K}.`>;
}[keyof X & string];
type Flat<U> = (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void
  ? I
  : never;
type ModAliases<T> = Flat<
  {
    [K in keyof T & string]: Kind<K, T[K]> extends "module"
      ? T[K] extends { "~aliases": infer MA }
        ? { [N in keyof MA & string as `${K}.${N}`]: MA[N] }
        : never
      : Kind<K, T[K]> extends "tokens"
        ? T[K] extends { tokens: infer X }
          ? Flat<Paths<X, `${K}.`>>
          : never
        : never;
  }[keyof T & string]
>;
export type AliasesOf<T> = Own<T> & ModAliases<T>;
type Public<T> = Resolved<{
  [K in keyof Own<T> as Private<K> extends true ? never : K]: Own<T>[K];
}>;
type UsableOf<T> = {
  [K in keyof T & string]: Kind<K, T[K]> extends Usable
    ? Strip<K>
    : Kind<K, T[K]> extends "module"
      ? T[K] extends { "~usable": infer U extends string }
        ? `${K}.${U}`
        : never
      : never;
}[keyof T & string];
type PublicUsable<T> = {
  [K in keyof T & string]: Private<K> extends true
    ? never
    : Kind<K, T[K]> extends Usable
      ? K
      : Kind<K, T[K]> extends "module"
        ? T[K] extends { "~usable": infer U extends string }
          ? `${K}.${U}`
          : never
        : never;
}[keyof T & string];

// ───────────────────────────── members ─────────────────────────────

type Excluded<X extends string> = string extends X ? never : X;
/** The chain of a context: each method is checked against its grammar and leaves the chain, so it is used once. */
export type Chain<L extends string, M, A> = Style & {
  readonly [K in keyof M & string]: M[K] extends MethodDef<infer G, infer Sp, infer X>
    ? string extends G
      ? (...parts: [`${L}.${K}: the grammar is not a literal type: write it as const`]) => never
      : G extends ""
        ? () => Chain<L, Omit<M, K | Excluded<X>>, A>
        : <const P extends readonly Part[]>(
            ...parts: CheckIn<`${L}.${K}`, Expand<G, A>, boolean extends Sp ? false : Sp, P>
          ) => Chain<L, Omit<M, K | Excluded<X>>, A>
    : never;
};

// positional and record arguments
type Err<Why extends string> = { readonly $error: Why };
type Gram<L extends string, G extends string, V extends Part> = CheckIn<
  L,
  G,
  false,
  [V]
>[0] extends infer R
  ? [V] extends [R]
    ? V
    : R extends string
      ? Err<R>
      : never
  : never;
type Req<D> = { [K in keyof D as K extends `${string}?` ? never : K]: unknown };
type DefOf<D, K> = K extends keyof D
  ? D[K]
  : `${K & string}?` extends keyof D
    ? D[`${K & string}?`]
    : never;
// The checked form of one argument: the value itself when it is valid, else the message as an object.
type One<L extends string, A, S, V, Tok> = S extends "$tokens"
  ? V extends object
    ? V
    : Err<`${L}: expected a token set (createTokens)`>
  : S extends "$overrides"
    ? [Tok] extends [never]
      ? Err<`${L}: "$overrides" needs a "$tokens" before it`>
      : CheckOverrides<Tok, V>
    : S extends "$selector"
      ? V extends string
        ? ValidSelector<V> extends V
          ? V
          : Err<ValidSelector<V>>
        : Err<`${L}: expected a selector`>
      : S extends string
        ? V extends Part
          ? Gram<L, Expand<S, A>, V>
          : Err<`${L}: expected a value`>
        : S extends Typed<infer T>
          ? V extends T
            ? V
            : Err<`${L}: wrong type`>
          : V extends object
            ? { [K in keyof V]: One<`${L}.${K & string}`, A, DefOf<S, K>, V[K], never> } & Req<S>
            : Err<`${L}: expected an object`>;
type TokensAt<D extends readonly unknown[], P extends readonly unknown[]> = D extends readonly [
  infer H,
  ...infer R,
]
  ? H extends "$tokens"
    ? P extends readonly [infer X, ...unknown[]]
      ? X
      : never
    : P extends readonly [unknown, ...infer Q]
      ? TokensAt<R, Q>
      : never
  : never;
type CheckAll<L extends string, A, D extends readonly unknown[], P extends readonly unknown[]> = {
  [K in keyof P]: K extends keyof D ? One<L, A, D[K], P[K], TokensAt<D, P>> : P[K];
};
// The arguments that may be left out: a trailing object with only optional keys.
type Arity<D extends readonly unknown[]> = D extends readonly [...infer R, infer Last]
  ? Last extends string | Typed<unknown>
    ? { readonly [K in keyof D]: unknown }
    : [keyof Req<Last>] extends [never]
      ? readonly [...{ [K in keyof R]: unknown }, unknown?]
      : { readonly [K in keyof D]: unknown }
  : readonly [];

// What `build` receives: grammar parts as text, tokens and overrides as objects, `arg<T>()` as T.
type Param<Def> = Def extends "$tokens"
  ? object
  : Def extends "$overrides"
    ? { readonly [group: string]: unknown }
    : Def extends "$selector"
      ? string
      : Def extends string
        ? string
        : Def extends Typed<infer T>
          ? T
          : {
              -readonly [K in keyof Def as K extends `${string}?` ? never : K]: Param<Def[K]>;
            } & {
              -readonly [K in keyof Def as K extends `${infer R}?` ? R : never]?: Param<Def[K]>;
            };
type Params<D> = D extends string
  ? [value: string]
  : D extends Typed<infer T>
    ? [value: T]
    : D extends readonly unknown[]
      ? D extends readonly [...infer R, infer Last]
        ? Last extends string | Typed<unknown>
          ? { -readonly [K in keyof D]: Param<D[K]> }
          : [keyof Req<Last>] extends [never]
            ? [...{ -readonly [K in keyof R]: Param<R[K]> }, Param<Last>]
            : { -readonly [K in keyof D]: Param<D[K]> }
        : []
      : never;

// A member that takes `args` (a call or a value member) and returns R; L names it in the messages.
type Callable<L extends string, D, A, R> = D extends string
  ? <const P extends readonly Part[]>(...parts: CheckIn<L, Expand<D, A>, false, P>) => R
  : D extends Typed<infer X>
    ? (value: X) => R
    : D extends readonly unknown[]
      ? <const P extends Arity<D>>(...args: P & CheckAll<L, A, D, P>) => R
      : never;

// The name in a value member's messages: its `label`, else its key.
type Label<K extends string, V> = V extends { label?: infer L }
  ? NonNullable<L> extends infer S extends string
    ? [S] extends [never]
      ? K
      : S
    : K
  : K;

// A string result (a literal, a template literal) is opaque as `string` is; a Typed OM value keeps its type.
type Opaque<R> = R extends string ? string : R;

type MemberOf<K extends string, V, A> =
  Kind<K, V> extends "chain"
    ? V extends { chain: infer M }
      ? () => Chain<K, M, A>
      : never
    : Kind<K, V> extends "call"
      ? V extends { args: infer D }
        ? Callable<K, D, A, Style>
        : never
      : Kind<K, V> extends "value"
        ? V extends { args: infer D; value: (args: never) => infer R }
          ? Callable<Label<K, V>, D, A, Opaque<R>>
          : never
        : Kind<K, V> extends "prop"
          ? V extends infer G extends string
            ? <const P extends readonly Part[]>(
                ...parts: CheckIn<K, Expand<G, A>, false, P>
              ) => Style
            : never
          : never;

/** What `.export()` gives: the members of the table, typed from it (a `-prefixed` property is camel-cased, an embedded scope nests). */
export type Members<T> = {
  [K in keyof T & string as Private<K> extends true
    ? never
    : Kind<K, T[K]> extends "chain" | "call" | "value"
      ? K
      : Kind<K, T[K]> extends "prop"
        ? Camel<K>
        : Kind<K, T[K]> extends "module"
          ? K
          : never]: Kind<K, T[K]> extends "module"
    ? T[K] extends { "~scope": string; "~table": infer MT }
      ? Members<MT>
      : never
    : MemberOf<K, T[K], AliasesOf<T>>;
};

// ───────────────────────────── checks on the table ─────────────────────────────

type Bad<Why extends string> = { readonly $error: `cssints: ${Why}` };
type BadUses<N extends string, T, V> = V extends { uses: readonly (infer U extends string)[] }
  ? [Exclude<U, UsableOf<T>>] extends [never]
    ? unknown
    : Bad<`${N}: uses ${Exclude<U, UsableOf<T>>}, which is not a kernel, global, layers, runtime or conflicts of this scope`>
  : unknown;
// `uses` names a private key without its `#`, so `#x` and `x` in one table would be one name for two keys.
type Clash<N extends string, T, K> = K extends `#${infer R}`
  ? R extends keyof T
    ? Bad<`${N}: ${K} and ${R} share a name: rename one`>
    : unknown
  : unknown;
// A value member with a tuple or `arg<T>()` written in place: its `value` would be typed as a grammar's parts.
type BadValue<N extends string, K, V> = V extends {
  args: infer D;
  value: (args: infer P) => unknown;
}
  ? D extends string
    ? unknown
    : [P] extends [never]
      ? unknown
      : Bad<`${N}: ${K & string}: a value member with a tuple or arg<T>() is written fn({ args, value })`>
  : unknown;
export type Valid<N extends string, T> = {
  readonly [K in keyof T]: BadUses<N, T, T[K]> & Clash<N, T, K> & BadValue<N, K, T[K]>;
};
type CallKeys<T> = {
  [K in keyof T & string]: Kind<K, T[K]> extends "call" ? K : never;
}[keyof T & string];
type ArgsOf<E> = E extends { args: infer D } ? D : never;
/** The `build` of each call member, typed from its `args`. */
export type Impl<T> = {
  readonly [K in CallKeys<T>]: (...args: Params<ArgsOf<T[K]>>) => Made;
};

export interface Scope<N extends string, T> {
  readonly "~scope": N;
  readonly "~table": T;
  /** The public aliases, resolved: what an embedding scope reads as `<key.alias>`. */
  readonly "~aliases": Public<T>;
  readonly "~usable": PublicUsable<T>;
  readonly name: N;
  /** The typed members of the table: `export const { ring } = scope("ring", { ... }).export()`. */
  export(): Members<T>;
}
/** A scope with call members (`args`) is not usable until `.build()` gives the function of each: typed from its `args`. */
export interface Pending<N extends string, T> {
  build(impl: Impl<T>): Scope<N, T>;
}

// ───────────────────────────── the engine ─────────────────────────────

/** What the engine gives the front, loosely typed (the types are the signatures of the front). */
export interface Engine {
  scope(name: string, table: object): unknown;
  lacking(keys: readonly string[]): string[];
  dependsOn(path: string): void;
  inGroup(group: string, property: string, value: string): boolean;
}
/** The engine, once the library is loaded (the prepended import of every module with sites loads it before any plugin module runs). */
export const engine = (): Engine => {
  const e = (globalThis as { __cssints?: { engine?: Engine } }).__cssints?.engine;
  if (!e)
    throw new Error(
      "cssints: the plugin helpers run at build time, once the cssints library is loaded",
    );
  return e;
};

/**
 * A plugin is a scope: `scope("name", table)`. The table holds, by shape: syntax aliases (a string), typed properties (a
 * `-vendor-prop` key with a grammar), kernels, static globals, layers, runtimes, conflicts, token sets and embedded scopes,
 * and the members (`chain`, `args` + `build`, `args` + `value`). A key starting `#` is private. Everything it declares is
 * namespaced by `name`, which is unique in the process (`cssints` and `derived` are reserved).
 */
export function scope<const N extends string, const T extends Table>(
  name: N,
  table: T & Valid<N, T>,
): [CallKeys<T>] extends [never] ? Scope<N, T> : Pending<N, T>;
export function scope(name: string, table: object): unknown {
  return engine().scope(name, table);
}

/**
 * The build's targets that lack one of the BCD keys, as browserslist names them (`["firefox 140"]`), by the rules of the
 * support warnings (`partial_implementation` lacks); empty when every target has them all. Build time, like `scope()`.
 */
export const lacking = (...keys: BcdKey[]): string[] => engine().lacking(keys);

/**
 * Tells the engine that the module being evaluated read the file at `path` (relative to the working directory): in dev, an
 * edit of the file runs that module again, as an edit of a module it imports does; in `vite build --watch`, it is a watched
 * file. Build time, like `scope()`: in a member's functions or in the plugin's own.
 */
export const dependsOn = (path: string): void => engine().dependsOn(path);

/**
 * Whether a declaration is in an export group (`cssints/widely-available`, `baseline-2022/with-downstream`, ...): the group
 * has the property and the value holds no word the group bans. A property cssints has no member for (a custom property, a
 * vendor-prefixed one) is in every group. A plugin that has a variant per group emits only what passes. Build time, like
 * `scope()`; an unknown group is an error.
 */
export const inGroup = (group: string, property: string, value: string): boolean =>
  engine().inGroup(group, property, value);
