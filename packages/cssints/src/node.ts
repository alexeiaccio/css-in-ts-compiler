// The style node and what builders say of a failure, with no dependency on Node: what `cssints/plugin` (author.ts, scope.ts)
// stands on, so the types of a plugin author do not pull Node's into a program. Shared by lib.ts (the css.* builders).
// Plain code like lib.ts: user code calls these in expressions.
import { MacroError, MemberError } from "./errors.ts";
import {
  type GlobalRule,
  type Kernel,
  type LayersDecl,
  type Plug,
  type Property,
  registry,
  type ThemeRule,
} from "./registry.ts";

/**
 * One condition of a style: an at-rule prelude (`@media (width >= 40rem)`), a pseudo-class (`:hover`), an attribute
 * (`[aria-current="page"]`) or, with `ancestor`, a selector of a marked ancestor (`:where(._g:hover)`), or, with
 * `nest` (kernels only), other elements relative to the class (`& > *`: `&` is the class, the rest follows it).
 * `rank` orders the rules of a layer: the min-width of a media or container query in px, the place of a pseudo-class.
 */
export interface Cond {
  text: string;
  rank: number;
  ancestor?: true;
  nest?: true;
}
/**
 * One declaration: property and value, under the conditions that wrap it (outermost first). `fallbacks` are the other
 * values of a `firstThatWorks(...)`, best first: the rule prints them before `value`, which is the one wanted.
 */
export type Decl = [prop: string, value: string, conds?: Cond[], fallbacks?: string[]];
/**
 * What a css.* builder returns: its declarations, and next to them the fixed classes it prints (`markers`, each with
 * the key of the kernel it belongs to), the kernels it needs, and the plugin members whose runtime and conflicts apply
 * (`plugs`). `cn()` merges all three.
 */
export interface CssNode {
  __cssints: Decl[];
  markers?: [marker: string, kernel: string][];
  kernels?: Kernel[];
  globals?: GlobalRule[];
  themes?: ThemeRule[];
  layers?: LayersDecl[];
  plugs?: Plug[];
}
export type Carry = Pick<
  CssNode,
  "markers" | "kernels" | "globals" | "themes" | "layers" | "plugs"
>;

// What a plain style does when a method is chained on it.
const plain = (method: string): never => {
  throw fail(`cssints: plain styles do not chain (.${method}); merge them with cn(...) or cx(...)`);
};

// A style node. Chaining a method on it calls `chain(name, args, self)`, which makes the next node (flex() and grid(),
// a plugin's context). The target always has the three carried keys (undefined when empty): a missing one would read
// as a chain method.
export const node = (
  decls: Decl[],
  { markers, kernels, globals, themes, layers, plugs }: Carry = {},
  chain: (name: string, args: unknown[], self: CssNode) => CssNode = (name) => plain(name),
): CssNode =>
  new Proxy<CssNode>(
    { __cssints: decls, markers, kernels, globals, themes, layers, plugs },
    {
      get: (t, k) =>
        k in t || typeof k === "symbol"
          ? (t as unknown as Record<string | symbol, unknown>)[k]
          : (...args: unknown[]) => chain(k, args, t),
    },
  );

export const camel = (p: string) => p.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

// A builder error names the call site being evaluated (`__at` set it), when there is one.
export const fail = (message: string) => new MacroError({ message, ...registry.at });
// The same for what a plugin member does wrong.
export const failIn = (plugin: string, message: string) =>
  new MemberError({ message, pluginName: plugin, ...registry.at });

export const isNode = (v: unknown): v is CssNode =>
  !!v && typeof v === "object" && Array.isArray((v as CssNode).__cssints);

// The texts a value is checked as. The recognizer reads text and knows no var(): a token (`var(--name)`, however a
// string came to hold it) is checked as literals of its type, one text per literal a type has (lengthPercentage: a
// length and a percentage). A var() of no token stays as it is.
export const VAR = /var\((--[\w-]+)\)/g;
export function probed(value: string, properties: Map<string, Property>): string[] {
  if (!value.includes("var(--")) return [value];
  const probesOf = (name: string) => properties.get(name)?.probes ?? [];
  let n = 1;
  for (const [, name] of value.matchAll(VAR)) n = Math.max(n, probesOf(name!).length);
  return Array.from({ length: n }, (_, i) =>
    value.replace(VAR, (m, name: string) => probesOf(name)[i] ?? probesOf(name)[0] ?? m),
  );
}
