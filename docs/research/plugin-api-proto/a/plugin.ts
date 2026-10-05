// DRAFT of "cssints/plugin" (design A: ArkType scopes, literally). Declarations only; the implementation would sit in the same
// file (author.ts) and the types below are the types of its real signatures: there is no second types file.
import type { CSSStyleValue } from "@cssints/css-grammar/values";
import type { CheckIn, Part, Style } from "cssints-src/parts.ts";
import type { CheckOverrides } from "cssints-src/theme-types.ts";

export type { Part, Style };

// ───────────────────────────── the entries of a table ─────────────────────────────

/** A declaration an entry emits. A custom property written `--_x` is the scope's own: it prints as `--<scope>-x`. */
export type Decl = readonly [prop: string, value: string];
export type BcdKey = `css.${string}`;

/**
 * A kernel: global CSS printed once. `&` stands for the class the kernel owns (the engine mints it), `--_x` for a custom
 * property of this scope. A member that `uses` a kernel prints its class.
 */
export interface KernelDef {
  css: string;
  atProperty?: string;
  requires?: (BcdKey | { key: BcdKey; exact: true })[];
}
/** A static global rule: `layer` is a top-level layer name (a name of a contract, so never namespaced), `null` prints it verbatim. */
export interface GlobalDef {
  rule: string;
  layer?: string | null;
}
export interface ParentVar {
  marker: "&";
  read: `--_${string}`;
  write: `--_${string}`;
  watch?: `--_${string}`;
}
/** The browser half: delivered by targets, as today (`virtual:cssints/runtime/<scope>.<entry>`). */
export interface RuntimeDef {
  polyfills: BcdKey[];
  parentVars?: ParentVar[];
  css?: string;
}
export interface ConflictDef {
  props: (string | RegExp)[];
  message: string;
}
/** A token set the scope owns: its paths become syntax aliases (`<theme.color.bg>` is the token's type). */
export interface TokensDef {
  tokens: object;
}

/** One method of a chain. `args: ""` takes no value. */
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
export declare function arg<T>(): Typed<T>;

/** One named argument: a grammar (aliases of the table allowed), `$tokens`, `$overrides` (the overrides of the `$tokens` argument), or `arg<T>()`. */
export type ArgDef = string | Typed<unknown>;
/**
 * What a call takes: a grammar (the parts, joined by a space, as a property takes them), `arg<T>()` (one value of a TypeScript
 * type), or a record of named arguments (`"key?"` is optional): the call takes one object.
 */
export type ArgsDef = string | Typed<unknown> | { readonly [key: string]: ArgDef };

/** What a member's build gives: declarations, and what else it needs by name (`uses`), globals and themes. */
export interface Built {
  decls?: Decl[];
  /** Entries of the table (kernels, globals, runtimes, conflicts) chosen by this call; `module.entry` for an embedded scope. */
  uses?: readonly string[];
  /** A rule that is not a class: keyed by the engine from its content, forgotten with the file that made it. */
  globals?: { css: string; layer?: string | null }[];
  /** `createGlobalTheme(tokens, selector, overrides, { layer })`, plus `@scope` containment: registered like any theme. */
  themes?: { tokens: object; overrides: object; selector: string; layer?: string; scope?: string }[];
}

export interface ChainDef {
  chain: { readonly [method: string]: MethodDef };
  uses?: readonly string[];
}
/** A member that takes arguments and gives declarations: its function is the entry of the same name in `.build()`. */
export interface CallDef {
  args: ArgsDef;
  uses?: readonly string[];
}
export interface ValueDef {
  args: string;
  value: (parts: string[]) => string | CSSStyleValue;
}
export interface ModuleLike {
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
                  : V extends { css: unknown }
                    ? "kernel"
                    : never;
type Strip<K> = K extends `#${infer R}` ? R : K;
type Private<K> = K extends `#${string}` ? true : false;
type Usable = "kernel" | "global" | "runtime" | "conflicts";

// ───────────────────────────── aliases: the local syntax names ─────────────────────────────

type Camel<S extends string> = S extends `-${infer H}`
  ? Camel<H>
  : S extends `${infer A}-${infer B}`
    ? `${A}${Capitalize<Camel<B>>}`
    : S;

/** `<name>` of the table in place, as a group; what is not an alias of the table is left to mdn. */
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
  [K in keyof X & string]: X[K] extends { readonly "~token": infer Kd extends string }
    ? { [Q in `${P}${K}`]: `<${Kd}>` }
    : Paths<X[K], `${P}${K}.`>;
}[keyof X & string];
type Flat<U> = (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
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

// named arguments
type Req<D> = { [K in keyof D as K extends `${string}?` ? never : K]: unknown };
type Opt<D> = { [K in keyof D as K extends `${infer R}?` ? R : never]?: unknown };
type DefOf<D, K> = K extends keyof D ? D[K] : `${K & string}?` extends keyof D ? D[`${K & string}?`] : never;
type TokensKey<D> = { [K in keyof D]: D[K] extends "$tokens" ? K : never }[keyof D];
type Err<Why extends string> = { readonly $error: Why };
// A grammar failure keeps the value and adds the message as an object, so the error names the argument and says why.
type Gram<L extends string, G extends string, V extends Part> =
  CheckIn<L, G, false, [V]>[0] extends infer R
    ? [V] extends [R]
      ? V
      : R extends string
        ? Err<R>
        : never
    : never;
type Arg<L extends string, A, K, Def, V, Rec, D> = [Def] extends [never]
  ? Err<`${L}: no such argument`>
  : Def extends "$tokens"
    ? V extends object
      ? V
      : Err<`${L}.${K & string}: expected a token set (createTokens)`>
    : Def extends "$overrides"
      ? CheckOverrides<TokensKey<D> extends infer Q extends keyof Rec ? Rec[Q] : never, V>
      : Def extends string
        ? V extends Part
          ? Gram<`${L}.${K & string}`, Expand<Def, A>, V>
          : Err<`${L}.${K & string}: expected a value`>
        : Def extends Typed<infer T>
          ? V extends T
            ? V
            : Err<`${L}.${K & string}: wrong type`>
          : never;
export type CheckRec<L extends string, A, D, V> = {
  [K in keyof V]: Arg<L, A, K, DefOf<D, K>, V[K], V, D>;
};
// What `build` receives, from the definition: grammar parts as text, tokens and overrides as objects, `arg<T>()` as T.
type Param<Def> = Def extends "$tokens"
  ? object
  : Def extends "$overrides"
    ? { readonly [group: string]: unknown }
    : Def extends string
    ? string
    : Def extends Typed<infer T>
      ? T
      : never;
type Params<D> = D extends string
  ? [value: string]
  : D extends Typed<infer T>
    ? [value: T]
    : [
        args: { -readonly [K in keyof D as K extends `${string}?` ? never : K]: Param<D[K]> } & {
          -readonly [K in keyof D as K extends `${infer R}?` ? R : never]?: Param<D[K]>;
        },
      ];

type MemberOf<L extends string, K extends string, V, A> =
  Kind<K, V> extends "chain"
    ? V extends { chain: infer M }
      ? () => Chain<K, M, A>
      : never
    : Kind<K, V> extends "call"
      ? V extends { args: infer D }
        ? D extends string
          ? <const P extends readonly Part[]>(...parts: CheckIn<K, Expand<D, A>, false, P>) => Style
          : D extends Typed<infer X>
            ? (value: X) => Style
            : <const R extends object>(args: R & CheckRec<K, A, D, R> & Req<D> & Opt<D>) => Style
        : never
      : Kind<K, V> extends "value"
        ? V extends { args: infer G extends string; value: (parts: string[]) => infer R }
          ? <const P extends readonly Part[]>(...parts: CheckIn<K, Expand<G, A>, false, P>) => R
          : never
        : Kind<K, V> extends "prop"
          ? V extends infer G extends string
            ? <const P extends readonly Part[]>(...parts: CheckIn<K, Expand<G, A>, false, P>) => Style
            : never
          : never;

/** What `.export()` gives: the members of the table, typed from it (a `-prefixed` property is camel-cased, an embedded scope nests). */
export type Members<N extends string, T> = {
  [K in keyof T & string as Private<K> extends true
    ? never
    : Kind<K, T[K]> extends "chain" | "call" | "value"
      ? K
      : Kind<K, T[K]> extends "prop"
        ? Camel<K>
        : Kind<K, T[K]> extends "module"
          ? K
          : never]: Kind<K, T[K]> extends "module"
    ? T[K] extends { "~scope": infer MN extends string; "~table": infer MT }
      ? Members<MN, MT>
      : never
    : MemberOf<N, K, T[K], AliasesOf<T>>;
};

// ───────────────────────────── checks on the table ─────────────────────────────

type Bad<Why extends string> = { readonly $error: `cssints: ${Why}` };
type BadUses<N extends string, T, V> = V extends { uses: readonly (infer U extends string)[] }
  ? [Exclude<U, UsableOf<T>>] extends [never]
    ? unknown
    : Bad<`${N}: uses ${Exclude<U, UsableOf<T>>}, which is not a kernel, global, runtime or conflicts of this scope`>
  : unknown;
export type Valid<N extends string, T> = {
  readonly [K in keyof T]: BadUses<N, T, T[K]>;
};
type CallKeys<T> = { [K in keyof T & string]: Kind<K, T[K]> extends "call" ? K : never }[keyof T & string];
type ArgsOf<E> = E extends { args: infer D } ? D : never;
/** The `build` of each call member, typed from its `args`: grammar parts arrive as text, tokens and overrides as objects, `arg<T>()` as T. */
export type Impl<T> = {
  readonly [K in CallKeys<T>]: (...args: Params<ArgsOf<T[K]>>) => Built;
};

export interface Scope<N extends string, T> {
  readonly "~scope": N;
  readonly "~table": T;
  /** The public aliases, resolved: what an embedding scope reads as `<key.alias>`. */
  readonly "~aliases": Public<T>;
  readonly "~usable": PublicUsable<T>;
  readonly name: N;
  /** The typed members of the table: `export const { ring } = scope("ring", { ... }).export()`. */
  export(): Members<N, T>;
}

/**
 * A plugin is a scope: `scope("name", table)`. The table holds, by shape: syntax aliases (a string), typed properties (a
 * `-vendor-prop` key with a grammar), kernels, static globals, runtimes, conflicts, token sets and embedded scopes, and the
 * members (`chain`, `args` + `build`, `args` + `value`). A key starting `#` is private. Everything it declares is namespaced by `name`.
 */
export declare function scope<const N extends string, const T extends Table>(
  name: N,
  table: T & Valid<N, T>,
): [CallKeys<T>] extends [never] ? Scope<N, T> : Pending<N, T>;

/** A scope with call members (`args`) is not usable until `.build()` gives the function of each: typed from its `args`. */
export interface Pending<N extends string, T> {
  build(impl: Impl<T>): Scope<N, T>;
}
