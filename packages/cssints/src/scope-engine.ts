// The engine behind "cssints/plugin" (scope.ts and author.ts declare what it does): `scope()`. Build time only. Its public types are those of the front, so what is typed here is
// loose; macro.ts registers `engine` in the registry, where the front finds it.
import { checkValueNow, isDeclarationError } from "@cssints/css-grammar/check";
import { properties } from "@cssints/css-grammar/mdn";
import { checkSelectorNow } from "@cssints/css-grammar/selector";
import { grammarOf } from "@cssints/css-grammar/token";
import { CSSStyleValue } from "@cssints/css-grammar/values";
import { Result } from "effect";

import { MemberError } from "./errors.ts";
import { relation } from "./leaves.ts";
import { camel, type Carry, failIn, isNode, node, probed, type CssNode } from "./node.ts";
import { type Kernel, type Plug, registry } from "./registry.ts";
import type {
  ArgsDef,
  CallDef,
  ChainDef,
  ConflictDef,
  GlobalDef,
  KernelDef,
  LayersDef,
  Made,
  MethodDef,
  RuntimeDef,
  ValueDef,
} from "./scope.ts";

// ───────────────────────────── the implementation ─────────────────────────────

const NAME = /^[a-z][a-z0-9-]*$/;
const KEY = /^[A-Za-z][\w-]*$/;
const RESERVED = new Set(["cssints", "derived"]);
// A custom property of the scope's own, and the class of a kernel (`&`) or of one of another scope (`&(mod.key)`).
const OWN_VAR = /--_([\w-]*)/g;
const MARKER = /&\(([\w.-]+)\)|&/g;

type Dict<V> = Record<string, V>;
type AnyDef = Dict<unknown>;
interface Impl_ {
  name: string;
  table: Dict<unknown>;
  impl?: Dict<(...a: unknown[]) => Made>;
}
interface Compiled {
  aliases: Dict<string>;
  /** The aliases an embedding scope sees: the public ones, resolved. */
  exposed: Dict<string>;
}

const isScope = (v: unknown): v is Impl_ & Dict<unknown> =>
  !!v && typeof v === "object" && typeof (v as Dict<unknown>)["~scope"] === "string";
const isRecord = (v: unknown): boolean => !!v && typeof v === "object" && !isTyped(v);
const isTyped = (v: unknown): boolean =>
  !!v && typeof v === "object" && (v as Dict<unknown>)["~arg"] === 1;
const strip = (k: string) => (k.startsWith("#") ? k.slice(1) : k);
const isPrivate = (k: string) => k.startsWith("#");
const has = (v: unknown, k: string): boolean => !!v && typeof v === "object" && Object.hasOwn(v, k);

// The runtime of `Kind`: the same order.
const kindOf = (k: string, v: unknown): string => {
  if (typeof v === "string") return k.startsWith("-") ? "prop" : "alias";
  if (isScope(v)) return "module";
  if (has(v, "chain")) return "chain";
  if (has(v, "args") && has(v, "value")) return "value";
  if (has(v, "args")) return "call";
  if (has(v, "tokens")) return "tokens";
  if (has(v, "polyfills")) return "runtime";
  if (has(v, "props")) return "conflicts";
  if (has(v, "rule")) return "global";
  if (has(v, "layers")) return "layers";
  if (has(v, "css")) return "kernel";
  return "?";
};

// What `Expand` does to a grammar: each `<alias>` of the table in place as a group (a name that is not one is left to mdn).
const expand = (g: string, a: Dict<string>, depth = 0): string =>
  depth > 5 || !g.includes("<")
    ? g
    : g.replace(/<([^>]*)>/g, (m, n: string) =>
        Object.hasOwn(a, n) ? `[ ${expand(a[n]!, a, depth + 1)} ]` : m,
      );

// The syntax of every token of a token set, by path (`color.accent`).
const tokenSyntaxes = (tokens: unknown, prefix: string, out: Dict<string>): Dict<string> => {
  if (tokens && typeof tokens === "object")
    for (const [k, v] of Object.entries(tokens))
      if (v && typeof v === "object" && typeof (v as Dict<unknown>)["syntax"] === "string")
        out[`${prefix}${k}`] = grammarOf((v as Dict<string>)["syntax"]!);
      else tokenSyntaxes(v, `${prefix}${k}.`, out);
  return out;
};

// The text that says what a scope is: its table (functions as their source), and the embedded scopes by name and text.
const canon = (v: unknown): string => {
  if (typeof v === "function") return v.toString();
  if (v instanceof RegExp) return String(v);
  if (isScope(v)) return `scope(${v.name},${canon(v["~text"])})`;
  if (Array.isArray(v)) return `[${v.map(canon).join(",")}]`;
  if (v && typeof v === "object") {
    const json = (v as { toJSON?: () => unknown }).toJSON;
    if (typeof json === "function") return canon(json.call(v));
    return `{${Object.entries(v)
      .map(([k, x]) => `${JSON.stringify(k)}:${canon(x)}`)
      .join(",")}}`;
  }
  return JSON.stringify(v) ?? "undefined";
};

// The grammar check of a value, as the twin checks a property (a token in it as the literals of its type); a failure is
// a MemberError at the call site being evaluated.
export const check = (plugin: string, label: string, grammar: string, value: string): void => {
  for (const v of probed(value, registry.properties))
    Result.getOrThrowWith(
      Result.try({
        try: () => checkValueNow(label, grammar, v),
        catch: (e) => (isDeclarationError(e) ? failIn(plugin, e.message) : e),
      }),
      (e) => e,
    );
};

// The text of a call's parts: a lone number is a spacing step where `spacing`; anything else is joined by a space.
export const valueOf = (
  plugin: string,
  label: string,
  args: unknown[],
  spacing = false,
): string => {
  if (!args.length) throw failIn(plugin, `cssints: ${label}() expects a value`);
  if (args.some(isNode))
    throw failIn(
      plugin,
      `cssints: ${label}() takes values, not styles; merge styles with cn(...) or cx(...)`,
    );
  const [only] = args;
  return spacing && args.length === 1 && typeof only === "number"
    ? `${only * 0.25}rem`
    : args.join(" ");
};

// What a plugin's callback (`build`, `value`) throws is a failure at the call site, as a grammar error is.
export const ran = <T>(plugin: string, run: () => T) =>
  Result.getOrThrowWith(
    Result.try({
      try: run,
      catch: (e) =>
        e instanceof MemberError ? e : failIn(plugin, e instanceof Error ? e.message : String(e)),
    }),
    (e) => e,
  );

const thrown = (name: string, message: string) => failIn(name, `cssints: ${message}`);

class Compiler {
  readonly name: string;
  readonly table: Dict<unknown>;
  readonly impl: Dict<(...a: unknown[]) => Made> | undefined;
  readonly compiled: Compiled;
  // `uses` lists already resolved: the carry of a member
  private readonly carries = new Map<string, Carry>();
  private readonly kernels = new Map<string, Kernel>();
  // the conflicts of each kernel written as styles, by key
  private readonly derived = new Map<string, ConflictDef>();
  // the keyframes() and positionTry() rules of each kernel written as styles, by key
  private readonly atRules = new Map<string, Kernel[]>();

  constructor(s: Impl_, compiled: Compiled) {
    this.name = s.name;
    this.table = s.table;
    this.impl = s.impl;
    this.compiled = compiled;
  }

  // `--_x` is `--<scope>-x`.
  own = (s: string): string =>
    s.includes("--_") ? s.replace(OWN_VAR, (_, n: string) => `--${this.name}-${n}`) : s;
  grammar = (g: string) => expand(g, this.compiled.aliases);

  // The scope and the key an entry name points at: `core`, or `mod.core` of an embedded scope.
  private find(path: string): [scope: Compiler, key: string] {
    const dot = path.indexOf(".");
    if (dot < 0) return [this, path];
    const mod = this.table[path.slice(0, dot)];
    if (!isScope(mod))
      throw thrown(this.name, `${this.name}: ${path} is not an entry of this scope`);
    return compile(mod as unknown as Impl_).find(path.slice(dot + 1));
  }
  private entry(key: string): [string, unknown] {
    const k = Object.hasOwn(this.table, key) ? key : `#${key}`;
    const v = this.table[k];
    return [kindOf(k, v), v];
  }
  marker = (path: string): string => {
    const [s, key] = this.find(path);
    return `_${s.name}-${key}`;
  };
  // `&` in the css of a kernel or a runtime: the marker of `own`; `&(mod.key)`: that of another kernel.
  private mark = (css: string, own: string): string =>
    css.includes("&")
      ? css.replace(MARKER, (_, path?: string) => `.${path ? this.marker(path) : own}`)
      : css;

  kernel(key: string): Kernel {
    let k = this.kernels.get(key);
    if (k) return k;
    const [, def] = this.entry(key);
    const d = def as KernelDef;
    const marker = this.marker(key);
    let css = d.css as string;
    if (typeof d.css === "function") {
      const lib = registry.lib;
      if (!lib) throw thrown(this.name, `${this.name}.${key}: the css library is not loaded`);
      const made = ran(this.name, () => (d.css as (c: unknown) => unknown)(lib.css));
      const nodes = (Array.isArray(made) ? made : [made]) as CssNode[];
      const merged = (lib.css as Dict<(...n: CssNode[]) => CssNode>)["cn"]!(...nodes);
      const built = lib.kernelOf(`${this.name}.${key}`, merged, marker);
      css = built.css;
      if (built.kernels) this.atRules.set(key, built.kernels);
      // what the kernel sets, and what meets it in a `cn()`: the member that uses it may not set those
      this.derived.set(key, {
        props: Object.keys(properties).filter((p) =>
          built.props.some((k) => relation(p, k) !== "apart"),
        ),
        message: `kernel ${key} sets ${built.props.join(", ")}`,
      });
    }
    k = {
      key: `${this.name}.${key}`,
      css: this.own(this.mark(css, marker)),
      atProperty: d.atProperty && this.own(d.atProperty),
      requires: d.requires,
    };
    this.kernels.set(key, k);
    return k;
  }

  // What a list of `uses` puts on a node, once per list: markers and kernels, globals, layers, and a plug for each runtime and conflicts.
  carry(uses: readonly string[]): Carry {
    const id = uses.join(",");
    let c = this.carries.get(id);
    if (c) return c;
    c = {};
    const kinds = uses.map((u) => {
      const [s, key] = this.find(u);
      return [u, s, key, ...s.entry(key)] as const;
    });
    const first = kinds.find((k) => k[3] === "kernel");
    // a conflicts entry in the list replaces what the kernels written as styles derive
    const explicit = kinds.some((k) => k[3] === "conflicts");
    for (const [u, s, key, kind, def] of kinds) {
      if (kind === "kernel") {
        const k = s.kernel(key);
        (c.kernels ??= []).push(...(s.atRules.get(key) ?? []), k);
        (c.markers ??= []).push([s.marker(key), k.key]);
        const conflicts = explicit ? undefined : s.derived.get(key);
        if (conflicts)
          (c.plugs ??= []).push({ name: k.key, label: s.name, marker: s.marker(key), conflicts });
      } else if (kind === "global") {
        const g = def as GlobalDef;
        (c.globals ??= []).push({ css: s.own(g.rule), layer: g.layer });
      } else if (kind === "layers") {
        const l = def as LayersDef;
        (c.layers ??= []).push({ names: l.layers, before: l.before });
      } else if (kind === "runtime" || kind === "conflicts") {
        const r = def as RuntimeDef;
        if (!first && kind === "runtime" && (r.parentVars?.length || r.css?.includes("&")))
          throw thrown(this.name, `${this.name}: ${u} uses & but no kernel goes with it in uses`);
        const own = first ? first[1].marker(first[2]) : "";
        const plug: Plug = { name: `${s.name}.${key}`, label: s.name, marker: own };
        if (kind === "conflicts") plug.conflicts = def as ConflictDef;
        else {
          plug.runtime = {
            polyfills: r.polyfills,
            parentVars: r.parentVars?.map((p) => ({
              marker: own,
              read: s.own(p.read) as `--${string}`,
              write: s.own(p.write) as `--${string}`,
              watch: p.watch && (s.own(p.watch) as `--${string}`),
            })),
            css: r.css && s.own(s.mark(r.css, own)),
            script: r.script,
          };
        }
        (c.plugs ??= []).push(plug);
      }
    }
    this.carries.set(id, c);
    return c;
  }
}

// ─── identity: the name of a scope is unique in the process, and what it says is its content

const hashOf = (text: string) => {
  let a = 5381;
  let b = 52711;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    a = Math.imul(a ^ c, 2654435761);
    b = Math.imul(b ^ c, 1597334677);
  }
  return (a >>> 0).toString(36) + (b >>> 0).toString(36);
};

// A scope that another definition of the same name has not replaced: a name is unique per process. The same content again
// (every evaluation of a module that uses it runs the definition again) is nothing; other content replaces the old one
// (HMR) unless a file that used it still does: then two definitions share the name.
const register = (s: Impl_ & { "~text"?: string; "~hash"?: string }): string => {
  if (s["~hash"]) return s["~hash"];
  const table = s.table;
  for (const v of Object.values(table)) if (isScope(v)) register(v as never);
  const text = canon([table, s.impl]);
  const hash = hashOf(text);
  s["~text"] = text;
  s["~hash"] = hash;
  const old = registry.scopes.get(s.name);
  if (old && old !== hash) {
    const prefix = `${s.name}.`;
    const users = new Set<string>();
    for (const [key, e] of registry.kernels)
      if (key.startsWith(prefix)) e.users.forEach((u) => users.add(u));
    for (const [name, e] of registry.runtimes)
      if (name.startsWith(prefix)) e.users.forEach((u) => users.add(u));
    if (users.size)
      throw thrown(
        s.name,
        `scope "${s.name}" is defined twice with different content (${old}, now ${hash}) while ${[...users].join(", ")} still uses the old one: pick another name`,
      );
  }
  registry.scopes.set(s.name, hash);
  return hash;
};

const compiled = new WeakMap<object, Compiler>();
const compile = (s: Impl_): Compiler => {
  const hit = compiled.get(s);
  if (hit) return hit;
  const own: Dict<string> = {};
  const mods: Dict<string> = {};
  for (const [k, v] of Object.entries(s.table)) {
    const kind = kindOf(k, v);
    if (kind === "alias") own[strip(k)] = v as string;
    else if (kind === "tokens")
      Object.assign(mods, tokenSyntaxes((v as { tokens: unknown }).tokens, `${k}.`, {}));
    else if (isScope(v))
      for (const [n, g] of Object.entries(compile(v).compiled.exposed)) mods[`${k}.${n}`] = g;
  }
  const aliases = { ...own, ...mods };
  const exposed: Dict<string> = {};
  for (const k of Object.keys(s.table))
    if (!isPrivate(k) && kindOf(k, s.table[k]) === "alias")
      exposed[k] = expand(s.table[k] as string, aliases);
  const c = new Compiler(s, { aliases, exposed });
  compiled.set(s, c);
  return c;
};

// ─── the members

const member = (c: Compiler, key: string, kind: string, def: unknown): unknown => {
  const name = c.name;
  const d = def as AnyDef;
  if (kind === "prop") {
    if (Object.hasOwn(properties, key))
      throw thrown(name, `${key} is a CSS property already, with its own grammar`);
    const grammar = c.grammar(d as unknown as string);
    return (...args: unknown[]) => {
      const value = valueOf(name, key, args);
      check(name, key, grammar, value);
      registry.userProps.add(key);
      return node([[key, value]]);
    };
  }
  if (kind === "value") {
    const def = d as unknown as ValueDef;
    const { args: spec, label = key } = def;
    return (...args: unknown[]) => {
      const given = argsOf(c, label, spec, args);
      // a grammar's parts one by one, as written; a tuple's arguments as `build` gets them
      const out = ran(name, () =>
        def.value((typeof spec === "string" ? args.map(String) : given) as string[]),
      );
      if (typeof out !== "string" && !(out instanceof CSSStyleValue))
        throw thrown(name, `${label}() value must return a string or a Typed OM value`);
      return out;
    };
  }
  if (kind === "chain") return chainOf(c, key, d as unknown as ChainDef);
  return callOf(c, key, d as unknown as CallDef);
};

const chainOf = (c: Compiler, key: string, def: ChainDef) => {
  const { name } = c;
  const methods = def.chain as Dict<MethodDef>;
  const grammars = new Map<string, string>();
  // resolved at the first call, which runs inside a site: the css library a kernel written as styles needs is loaded then
  let base: Carry | undefined;
  const next =
    (used: ReadonlyMap<string, string>) =>
    (m: string, args: unknown[], self: CssNode): CssNode => {
      const meth = Object.hasOwn(methods, m) ? methods[m] : undefined;
      if (!meth)
        throw failIn(
          name,
          `cssints: ${key}() has no .${m}(); it chains ${Object.keys(methods)
            .filter((k) => !used.has(k))
            .join(", ")}`,
        );
      const by = used.get(m);
      if (by === m) throw failIn(name, `cssints: ${key}().${m}() is used twice`);
      if (by) throw failIn(name, `cssints: ${key}().${m}() cannot go with .${by}()`);
      let value = "";
      if (meth.args === "") {
        if (args.length) throw failIn(name, `cssints: ${key}().${m}() takes no value`);
      } else {
        value = valueOf(name, `${key}.${m}`, args, meth.spacing);
        let g = grammars.get(m);
        if (g === undefined) grammars.set(m, (g = c.grammar(meth.args)));
        check(name, `${key}.${m}`, g, value);
      }
      const taken = new Map(used).set(m, m);
      for (const x of meth.excludes ?? []) taken.set(x, m);
      return node([...self.__cssints, ...ownDecls(c, meth.emit(value))], self, next(taken));
    };
  return () => node([], (base ??= def.uses ? c.carry(def.uses) : {}), next(new Map()));
};

const ownDecls = (c: Compiler, emitted: readonly (readonly [string, string])[]) =>
  emitted.map(([p, v]): [string, string] => [c.own(p), c.own(v)]);

// One positional argument against its definition: the value as `build` gets it.
const argOf = (c: Compiler, label: string, def: unknown, v: unknown, tokens?: unknown): unknown => {
  const { name } = c;
  if (def === "$tokens") {
    if (!v || typeof v !== "object" || isNode(v) || v instanceof CSSStyleValue)
      throw failIn(name, `cssints: ${label} expects a token set (createTokens)`);
    return v;
  }
  if (def === "$overrides") {
    if (!tokens || !v || typeof v !== "object" || Array.isArray(v))
      throw failIn(name, `cssints: ${label} expects an object of values by token path`);
    return v;
  }
  if (def === "$selector") {
    if (typeof v !== "string") throw failIn(name, `cssints: ${label} expects a selector`);
    Result.getOrThrowWith(
      Result.try({
        try: () => checkSelectorNow(v),
        catch: (e) => (isDeclarationError(e) ? failIn(name, `cssints: ${label}: ${e.message}`) : e),
      }),
      (e) => e,
    );
    return v;
  }
  if (typeof def === "string") {
    const value = valueOf(name, label, [v]);
    check(name, label, c.grammar(def), value);
    return value;
  }
  if (isTyped(def)) return v;
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw failIn(name, `cssints: ${label} expects an object`);
  const out: Dict<unknown> = {};
  const rec = def as Dict<unknown>;
  for (const [k, leaf] of Object.entries(rec)) {
    const optional = k.endsWith("?");
    const field = optional ? k.slice(0, -1) : k;
    const x = (v as Dict<unknown>)[field];
    if (x === undefined) {
      if (!optional) throw failIn(name, `cssints: ${label}: ${field} is missing`);
      continue;
    }
    out[field] = argOf(c, `${label}.${field}`, leaf, x);
  }
  for (const k of Object.keys(v))
    if (!(k in out) && !(k in rec) && !(`${k}?` in rec))
      throw failIn(name, `cssints: ${label}: no argument ${k}`);
  return out;
};

// The arguments of a call or a value member, checked against `args`: as `build` and `value` get them.
const argsOf = (c: Compiler, label: string, spec: ArgsDef, args: unknown[]): unknown[] => {
  const { name } = c;
  if (typeof spec === "string") {
    const value = valueOf(name, label, args);
    check(name, label, c.grammar(spec), value);
    return [value];
  }
  if (isTyped(spec)) return args;
  const list = spec as readonly unknown[];
  if (args.length > list.length)
    throw failIn(name, `cssints: ${label}() takes at most ${list.length} arguments`);
  let tokens: unknown;
  return list.map((d, i) => {
    const v = argOf(c, `${label}(${i + 1})`, d, args[i] ?? (isRecord(d) ? {} : undefined), tokens);
    if (d === "$tokens") tokens = v;
    return v;
  });
};

const callOf = (c: Compiler, key: string, def: CallDef) => {
  const { name } = c;
  const build = c.impl?.[key];
  if (!build) throw thrown(name, `${name}.${key} has no function in build()`);
  const spec = def.args;
  const uses = def.uses ?? [];
  let base: Carry | undefined;
  return (...args: unknown[]) => {
    const given = argsOf(c, key, spec, args);
    const made = ran(name, () => build(...given));
    const carry = made.uses ? c.carry([...uses, ...made.uses]) : (base ??= c.carry(uses));
    return node(made.decls ? ownDecls(c, made.decls) : [], {
      ...carry,
      globals: made.globals ? [...(carry.globals ?? []), ...made.globals] : carry.globals,
      themes: made.themes,
      layers: made.layers
        ? [
            ...(carry.layers ?? []),
            has(made.layers, "layers")
              ? {
                  names: (made.layers as LayersDef).layers,
                  before: (made.layers as LayersDef).before,
                }
              : { names: made.layers as readonly string[] },
          ]
        : carry.layers,
    });
  };
};

const exportOf = (s: Impl_): Dict<unknown> => {
  const c = compile(s);
  register(s as never);
  const calls = Object.keys(s.table).filter((k) => kindOf(k, s.table[k]) === "call");
  if (calls.length && !s.impl)
    throw thrown(s.name, `${s.name}: call .build({ ${calls.join(", ")} }) before .export()`);
  const out: Dict<unknown> = {};
  for (const [k, v] of Object.entries(s.table)) {
    if (isPrivate(k)) continue;
    const kind = kindOf(k, v);
    if (isScope(v)) out[k] = exportOf(v);
    else if (kind === "prop") out[camel(k.slice(1))] = member(c, k, kind, v);
    else if (kind === "chain" || kind === "call" || kind === "value")
      out[k] = member(c, k, kind, v);
  }
  return out;
};

export function scope(name: string, table: Dict<unknown>): unknown {
  if (!NAME.test(name) || RESERVED.has(name))
    throw thrown(
      name,
      RESERVED.has(name)
        ? `scope "${name}" is reserved by the engine`
        : `scope(${JSON.stringify(name)}): a name is lowercase letters, digits and -, and starts with a letter`,
    );
  for (const k of Object.keys(table)) {
    if (!KEY.test(strip(k)) && !k.startsWith("-"))
      throw thrown(name, `${name}: the entry ${JSON.stringify(k)} is not a name`);
    // `uses` names a private key without its `#`: one name for two keys would point at the public one
    if (isPrivate(k) && Object.hasOwn(table, strip(k)))
      throw thrown(name, `${name}: ${k} and ${strip(k)} share a name: rename one`);
  }
  const s: Impl_ & Dict<unknown> = {
    name,
    table,
    "~scope": name,
    "~table": table,
    build(impl: Dict<(...a: unknown[]) => Made>) {
      const keys = Object.keys(table).filter((k) => kindOf(k, table[k]) === "call");
      const extra = Object.keys(impl).filter((k) => !keys.includes(k));
      if (extra.length || keys.some((k) => !Object.hasOwn(impl, k)))
        throw thrown(
          name,
          `${name}: build() takes a function for each call member: ${keys.join(", ")}`,
        );
      s.impl = impl;
      return s;
    },
    export: () => exportOf(s),
  };
  return s;
}

/** What the front (scope.ts) calls; macro.ts puts it in the registry. */
export const engine = { scope };
