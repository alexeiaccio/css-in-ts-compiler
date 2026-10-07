import { U as types_d_exports, Xd as Style, Yd as Part, qd as CheckIn, t as CheckOverrides } from "./theme-types-DlYu8X-e.mjs";
import { Syntax, TokenType } from "@cssints/css-grammar/token";
import { CSSStyleValue } from "@cssints/css-grammar/values";
import { ValidSelector } from "@cssints/css-grammar/query";
//#region src/author-types.d.ts
/** A declaration a member emits: property and value (a custom property, `--_r`, is allowed). */
type Decl = readonly [prop: string, value: string];
/** A feature of `@mdn/browser-compat-data`: `css.at-rules.container.style_queries_for_custom_properties`. */
type BcdKey = `css.${string}`;
/**
 * Global rules, registered once by `key` (`name@version`) in layer `_.k`; `atProperty` (the `@property` rules of its
 * custom properties) goes at the top of the sheet. A target lacking a `requires` feature gets a support warning, never an
 * error; `{ key, exact: true }` also counts a partial implementation as lacking (relative colour, whose channel scales
 * differ in Chrome 119-121 and Safari 16.4-17.6). Two members share a kernel by pointing at the same object; the same key with other CSS is a build error, as is
 * a custom property or a marker that two keys share.
 */
interface Kernel {
  key: string;
  css: string;
  atProperty?: string;
  requires?: (BcdKey | {
    key: BcdKey;
    exact: true;
  })[];
}
/**
 * A global rule a member contributes. It is identified by its content (`layer` and `css`): the same rule from two
 * styles is one, an edit of it replaces the old one, and it is in the sheet of the modules whose styles carry it, until
 * they stop. It goes to layer `_.k` with the kernels. Unlike a kernel, two globals **may** declare the same custom
 * property: a look sets the same `--color-*` in several source layers, which is the point of fill-through. Use it for a
 * rule that is not a class.
 */
interface GlobalRule {
  css: string;
  /**
   * A top-level `@layer` of this name to put the rule in (a rule that must beat the engine's `:root` fallbacks). The
   * layer must be declared: by `layers` of the same `Made`, or by `layers()` in a module this one imports. Omitted:
   * layer `_.k`.
   */
  layer?: string;
}
/**
 * A theme a member contributes, as `createGlobalTheme(tokens, selector, overrides, { layer, scope })` makes one: the
 * same checks (the paths and values of `overrides` against the types of `tokens`, a layer that is declared), the
 * aliases that depend on an override declared again, and `check.contrast` reads it. `tokens` is a token set of
 * `createTokens()` that the member got from its caller (a closure: the arguments of a member are joined into one string).
 */
interface ThemeRule {
  tokens: object;
  overrides: object;
  selector: string;
  layer?: string;
  /** A selector: the rule goes inside `@scope (<scope>) { ... }`. */
  scope?: string;
}
/** One element family of a runtime: the nearest `marker` ancestor's computed `read` is copied into `write`. */
interface ParentVar$1 {
  marker: string;
  read: `--${string}`;
  write: `--${string}`;
  /** A property that changes when a CSS condition (`:hover`, a media query) changes `read`: its transition re-runs the copy. */
  watch?: `--${string}`;
}
/**
 * The runtime half of a member. The client module that holds a site with the member imports
 * `virtual:cssints/runtime/<name>`, which is empty unless a browserslist target lacks a feature in `polyfills` (and has
 * `@property`, which the runtime stands on); then it configures `cssints/parent-vars`, and `css` (the fallback rules) is
 * added to the sheet in layer `_.k`.
 */
interface Runtime {
  polyfills: BcdKey[];
  parentVars?: ParentVar$1[];
  css?: string;
}
/** A build error when one `cn()` holds the member's marker and a property listed here (a name, or a pattern). */
interface Conflict {
  props: (string | RegExp)[];
  message: string;
}
//#endregion
//#region src/scope.d.ts
/** The `css` a kernel written as styles is handed: all of "cssints", as user code has it. */
type Css = typeof types_d_exports;
/**
 * A kernel: global CSS printed once, bound to a class. `&` stands for the class the engine mints for it (`&(mod.key)`: the
 * class of the kernel `key` of an embedded scope `mod`), `--_x` for the custom property `--<scope>-x`. `css` is verbatim
 * CSS, or styles (`(css) => css.outline("var(--_w)", "solid")`: declarations checked like a user's, printed as `&{...}`).
 */
interface KernelDef {
  css: string | ((css: Css) => Style | readonly Style[]);
  atProperty?: string;
  requires?: (BcdKey | {
    key: BcdKey;
    exact: true;
  })[];
}
/** A static global rule; `layer` is a top-level layer that `layers` declares (a contract's name: never namespaced). */
interface GlobalDef {
  rule: string;
  layer?: string;
}
/** Top-level layers to declare, in order. */
interface LayersDef {
  layers: readonly string[];
}
interface ParentVar {
  marker: "&";
  read: `--_${string}`;
  write: `--_${string}`;
  watch?: `--_${string}`;
}
/** The browser half, delivered when a target lacks a polyfilled feature (`virtual:cssints/runtime/<scope>.<entry>`); `&` is the marker of the member's first kernel. */
interface RuntimeDef {
  polyfills: BcdKey[];
  parentVars?: ParentVar[];
  css?: string;
}
/** A build error when one `cn()` holds the member's marker and a property listed here (a name, or a pattern). */
interface ConflictDef {
  props: (string | RegExp)[];
  message: string;
}
/** A token set the scope owns: its paths become syntax aliases (`<brand.color.accent>` is the token's type). */
interface TokensDef {
  tokens: object;
}
/** One method of a chain. `args: ""` takes no value; a lone number is a spacing step with `spacing`. */
interface MethodDef<G extends string = string, Sp extends boolean = boolean, X extends string = string> {
  readonly args: G;
  readonly spacing?: Sp;
  readonly excludes?: readonly X[];
  readonly emit: (value: string) => Decl[];
}
declare const typed: unique symbol;
/** An argument whose type is TypeScript's, not CSS's (`arg<"home" | "star">()`); the member's `build` checks it at build time. */
interface Typed<T> {
  readonly [typed]: T;
}
/** `arg<T>()`: one value of the TypeScript type `T`. */
export declare const arg: <T>() => Typed<T>;
/** One argument: a grammar (aliases of the table allowed), `"$tokens"` (a token set), `"$overrides"` (values for the paths of the `$tokens` before it), `"$selector"` (a CSS selector list) or `arg<T>()`. */
type Leaf = string | Typed<unknown>;
/** An object argument of named leaves (`"key?"` is optional). */
interface RecordDef {
  readonly [key: string]: Leaf;
}
/**
 * What a call takes: a grammar (the parts, joined by a space, as a property takes them), `arg<T>()`, or a tuple of
 * positional arguments, each a `Leaf` or one `RecordDef` (an object; it may be left out when all its keys are optional).
 */
type ArgsDef = Leaf | readonly (Leaf | RecordDef)[];
/** What a member's build gives: declarations, and what else it needs by name (`uses`), globals, themes and layers. */
interface Made {
  decls?: Decl[];
  /** Entries of the table (kernels, globals, layers, runtimes, conflicts) chosen by this call; `module.entry` for an embedded scope. */
  uses?: readonly string[];
  /** A rule that is not a class: identified by its content, forgotten with the file that made it. */
  globals?: {
    css: string;
    layer?: string;
  }[];
  /** As `createGlobalTheme(tokens, selector, overrides, { layer, scope })`: registered like any theme. */
  themes?: {
    tokens: object;
    overrides: object;
    selector: string;
    layer?: string;
    scope?: string;
  }[];
  /** Top-level layers to declare, in order. */
  layers?: string[];
}
interface ChainDef {
  chain: {
    readonly [method: string]: MethodDef;
  };
  uses?: readonly string[];
}
/** A member that takes arguments and gives declarations: its function is the entry of the same name in `.build()`. */
interface CallDef {
  args: ArgsDef;
  uses?: readonly string[];
}
interface ValueDef {
  args: string;
  value: (parts: string[]) => string | CSSStyleValue;
}
interface ModuleLike {
  readonly "~scope": string;
  readonly "~table": object;
  readonly "~aliases": object;
  readonly "~usable": string;
}
type Entry = string | ModuleLike | ChainDef | CallDef | ValueDef | KernelDef | GlobalDef | LayersDef | RuntimeDef | ConflictDef | TokensDef;
interface Table {
  readonly [key: string]: Entry;
}
type Kind<K, V> = V extends string ? K extends `-${string}` ? "prop" : "alias" : V extends ModuleLike ? "module" : V extends {
  chain: unknown;
} ? "chain" : V extends {
  args: unknown;
  value: unknown;
} ? "value" : V extends {
  args: unknown;
} ? "call" : V extends {
  tokens: unknown;
} ? "tokens" : V extends {
  polyfills: unknown;
} ? "runtime" : V extends {
  props: unknown;
} ? "conflicts" : V extends {
  rule: unknown;
} ? "global" : V extends {
  layers: unknown;
} ? "layers" : V extends {
  css: unknown;
} ? "kernel" : never;
type Strip<K> = K extends `#${infer R}` ? R : K;
type Private<K> = K extends `#${string}` ? true : false;
type Usable = "kernel" | "global" | "layers" | "runtime" | "conflicts";
type Camel<S extends string> = S extends `-${infer H}` ? Camel<H> : S extends `${infer A}-${infer B}` ? `${A}${Capitalize<Camel<B>>}` : S;
/** `<name>` of the table in place, as a group; what is not an alias of the table is left to mdn. The runtime `expand` does the same. */
type Expand<G extends string, A, D extends 0[] = []> = D["length"] extends 6 ? G : G extends `${infer Pre}<${infer N}>${infer Post}` ? N extends keyof A ? A[N] extends (infer S extends string) ? `${Pre}[ ${Expand<S, A, [...D, 0]>} ]${Expand<Post, A, D>}` : G : `${Pre}<${N}>${Expand<Post, A, D>}` : G;
type Own<T> = { [K in keyof T & string as Kind<K, T[K]> extends "alias" ? Strip<K> : never]: T[K]; };
type Resolved<A> = { [N in keyof A]: A[N] extends string ? Expand<A[N], A> : never; };
type Paths<X, P extends string = ""> = { [K in keyof X & string]: X[K] extends (() => {
  readonly "~token": infer Kd extends TokenType;
}) ? { [Q in `${P}${K}`]: `<${Syntax<Kd>}>`; } : Paths<X[K], `${P}${K}.`>; }[keyof X & string];
type Flat<U> = (U extends unknown ? (x: U) => void : never) extends ((x: infer I) => void) ? I : never;
type ModAliases<T> = Flat<{ [K in keyof T & string]: Kind<K, T[K]> extends "module" ? T[K] extends {
  "~aliases": infer MA;
} ? { [N in keyof MA & string as `${K}.${N}`]: MA[N]; } : never : Kind<K, T[K]> extends "tokens" ? T[K] extends {
  tokens: infer X;
} ? Flat<Paths<X, `${K}.`>> : never : never; }[keyof T & string]>;
type AliasesOf<T> = Own<T> & ModAliases<T>;
type Public<T> = Resolved<{ [K in keyof Own<T> as Private<K> extends true ? never : K]: Own<T>[K]; }>;
type UsableOf<T> = { [K in keyof T & string]: Kind<K, T[K]> extends Usable ? Strip<K> : Kind<K, T[K]> extends "module" ? T[K] extends {
  "~usable": infer U extends string;
} ? `${K}.${U}` : never : never; }[keyof T & string];
type PublicUsable<T> = { [K in keyof T & string]: Private<K> extends true ? never : Kind<K, T[K]> extends Usable ? K : Kind<K, T[K]> extends "module" ? T[K] extends {
  "~usable": infer U extends string;
} ? `${K}.${U}` : never : never; }[keyof T & string];
type Excluded<X extends string> = string extends X ? never : X;
/** The chain of a context: each method is checked against its grammar and leaves the chain, so it is used once. */
type Chain<L extends string, M, A> = Style & { readonly [K in keyof M & string]: M[K] extends MethodDef<infer G, infer Sp, infer X> ? string extends G ? (...parts: [`${L}.${K}: the grammar is not a literal type: write it as const`]) => never : G extends "" ? () => Chain<L, Omit<M, K | Excluded<X>>, A> : <const P extends readonly Part[]>(...parts: CheckIn<`${L}.${K}`, Expand<G, A>, boolean extends Sp ? false : Sp, P>) => Chain<L, Omit<M, K | Excluded<X>>, A> : never; };
type Err<Why extends string> = {
  readonly $error: Why;
};
type Gram<L extends string, G extends string, V extends Part> = CheckIn<L, G, false, [V]>[0] extends (infer R) ? [V] extends [R] ? V : R extends string ? Err<R> : never : never;
type Req<D> = { [K in keyof D as K extends `${string}?` ? never : K]: unknown; };
type DefOf<D, K> = K extends keyof D ? D[K] : `${K & string}?` extends keyof D ? D[`${K & string}?`] : never;
type One<L extends string, A, S, V, Tok> = S extends "$tokens" ? V extends object ? V : Err<`${L}: expected a token set (createTokens)`> : S extends "$overrides" ? [Tok] extends [never] ? Err<`${L}: "$overrides" needs a "$tokens" before it`> : CheckOverrides<Tok, V> : S extends "$selector" ? V extends string ? ValidSelector<V> extends V ? V : Err<ValidSelector<V>> : Err<`${L}: expected a selector`> : S extends string ? V extends Part ? Gram<L, Expand<S, A>, V> : Err<`${L}: expected a value`> : S extends Typed<infer T> ? V extends T ? V : Err<`${L}: wrong type`> : V extends object ? { [K in keyof V]: One<`${L}.${K & string}`, A, DefOf<S, K>, V[K], never>; } & Req<S> : Err<`${L}: expected an object`>;
type TokensAt<D extends readonly unknown[], P extends readonly unknown[]> = D extends readonly [infer H, ...infer R] ? H extends "$tokens" ? P extends readonly [infer X, ...unknown[]] ? X : never : P extends readonly [unknown, ...infer Q] ? TokensAt<R, Q> : never : never;
type CheckAll<L extends string, A, D extends readonly unknown[], P extends readonly unknown[]> = { [K in keyof P]: K extends keyof D ? One<L, A, D[K], P[K], TokensAt<D, P>> : P[K]; };
type Arity<D extends readonly unknown[]> = D extends readonly [...infer R, infer Last] ? Last extends string | Typed<unknown> ? { readonly [K in keyof D]: unknown; } : [keyof Req<Last>] extends [never] ? readonly [...{ [K in keyof R]: unknown; }, unknown?] : { readonly [K in keyof D]: unknown; } : readonly [];
type Param<Def> = Def extends "$tokens" ? object : Def extends "$overrides" ? {
  readonly [group: string]: unknown;
} : Def extends "$selector" ? string : Def extends string ? string : Def extends Typed<infer T> ? T : { -readonly [K in keyof Def as K extends `${string}?` ? never : K]: Param<Def[K]>; } & { -readonly [K in keyof Def as K extends `${infer R}?` ? R : never]?: Param<Def[K]>; };
type Params<D> = D extends string ? [value: string] : D extends Typed<infer T> ? [value: T] : D extends readonly unknown[] ? D extends readonly [...infer R, infer Last] ? Last extends string | Typed<unknown> ? { -readonly [K in keyof D]: Param<D[K]>; } : [keyof Req<Last>] extends [never] ? [...{ -readonly [K in keyof R]: Param<R[K]>; }, Param<Last>] : { -readonly [K in keyof D]: Param<D[K]>; } : [] : never;
type MemberOf<K extends string, V, A> = Kind<K, V> extends "chain" ? V extends {
  chain: infer M;
} ? () => Chain<K, M, A> : never : Kind<K, V> extends "call" ? V extends {
  args: infer D;
} ? D extends string ? <const P extends readonly Part[]>(...parts: CheckIn<K, Expand<D, A>, false, P>) => Style : D extends Typed<infer X> ? (value: X) => Style : D extends readonly unknown[] ? <const P extends Arity<D>>(...args: P & CheckAll<K, A, D, P>) => Style : never : never : Kind<K, V> extends "value" ? V extends {
  args: infer G extends string;
  value: (parts: string[]) => infer R;
} ? <const P extends readonly Part[]>(...parts: CheckIn<K, Expand<G, A>, false, P>) => R : never : Kind<K, V> extends "prop" ? V extends (infer G extends string) ? <const P extends readonly Part[]>(...parts: CheckIn<K, Expand<G, A>, false, P>) => Style : never : never;
/** What `.export()` gives: the members of the table, typed from it (a `-prefixed` property is camel-cased, an embedded scope nests). */
type Members<T> = { [K in keyof T & string as Private<K> extends true ? never : Kind<K, T[K]> extends "chain" | "call" | "value" ? K : Kind<K, T[K]> extends "prop" ? Camel<K> : Kind<K, T[K]> extends "module" ? K : never]: Kind<K, T[K]> extends "module" ? T[K] extends {
  "~scope": string;
  "~table": infer MT;
} ? Members<MT> : never : MemberOf<K, T[K], AliasesOf<T>>; };
type Bad<Why extends string> = {
  readonly $error: `cssints: ${Why}`;
};
type BadUses<N extends string, T, V> = V extends {
  uses: readonly (infer U extends string)[];
} ? [Exclude<U, UsableOf<T>>] extends [never] ? unknown : Bad<`${N}: uses ${Exclude<U, UsableOf<T>>}, which is not a kernel, global, layers, runtime or conflicts of this scope`> : unknown;
type Valid<N extends string, T> = { readonly [K in keyof T]: BadUses<N, T, T[K]>; };
type CallKeys<T> = { [K in keyof T & string]: Kind<K, T[K]> extends "call" ? K : never; }[keyof T & string];
type ArgsOf<E> = E extends {
  args: infer D;
} ? D : never;
/** The `build` of each call member, typed from its `args`. */
type Impl<T> = { readonly [K in CallKeys<T>]: (...args: Params<ArgsOf<T[K]>>) => Made; };
interface Scope<N extends string, T> {
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
interface Pending<N extends string, T> {
  build(impl: Impl<T>): Scope<N, T>;
}
/**
 * A plugin is a scope: `scope("name", table)`. The table holds, by shape: syntax aliases (a string), typed properties (a
 * `-vendor-prop` key with a grammar), kernels, static globals, layers, runtimes, conflicts, token sets and embedded scopes,
 * and the members (`chain`, `args` + `build`, `args` + `value`). A key starting `#` is private. Everything it declares is
 * namespaced by `name`, which is unique in the process (`cssints` and `derived` are reserved).
 */
export declare function scope<const N extends string, const T extends Table>(name: N, table: T & Valid<N, T>): [CallKeys<T>] extends [never] ? Scope<N, T> : Pending<N, T>;
//#endregion
export type { ArgsDef, Chain, Conflict, Css, Decl, Entry, GlobalRule, Impl, Kernel, KernelDef, Made, Members, Part, Pending, Runtime, Scope, Style, Table, ThemeRule, Typed };