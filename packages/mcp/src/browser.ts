// The browser inspector: what the devtools overlay shows a human, for an agent. A headless Chromium (playwright-core) for
// the session, one page per url, kept open (the dev server's HMR keeps it current). The devtools core
// (@cssints/devtools/inject, bundled by Vite on the first call) is added to the page, gets the table the live tools read
// from the dev server, and runs the overlay's cascade on the element, in the browser that paints it.
import { fileURLToPath } from "node:url";

import type { Model } from "@cssints/devtools/model";
import { Context, Effect, Layer, Predicate, Semaphore } from "effect";
import type { Browser as Chromium, Page } from "playwright-core";

import { kebab, ToolError } from "./check.ts";
import { Live } from "./live.ts";

// The shapes of @cssints/devtools' Inspection that cross from the page (cascade.ts).
interface Cond {
  text: string;
  holds: boolean;
}
interface Candidate {
  rule: number;
  selector: string;
  layer: string;
  specificity: [number, number, number];
  decl: { prop: string; value: string; important: boolean };
  conditions: Cond[];
  applies: boolean;
}
interface Verdict {
  prop: string;
  status: "ok" | "mismatch" | "unverified";
  computed: string;
  expected: string;
  reason?: string;
}
interface Row {
  prop: string;
  longhands: string[];
  winner?: Candidate;
  lost: { prop: string; by: Candidate }[];
  overridden: Candidate[];
  inactive: Candidate[];
  verdicts: Verdict[];
}
interface Inspection {
  element: string;
  groups: {
    site?: { file: string; line: number; column: number };
    classes: {
      cls: string;
      kind: string;
      plugin?: string;
      layer?: string;
      decls: Candidate["decl"][];
      conditions: Cond[];
      active: boolean;
    }[];
  }[];
  rows: Row[];
  tokens: {
    name: string;
    path?: string;
    computed: string;
    source?: { selector: string; layer: string; on: string };
  }[];
}

export interface PageState {
  readonly url?: string | undefined;
  readonly server?: string | undefined;
  readonly width?: number | undefined;
  readonly height?: number | undefined;
  readonly hover?: boolean | undefined;
  readonly focus?: boolean | undefined;
}

const MARK = { ok: "✓", mismatch: "✗", unverified: "?" } as const;
const decl = (d: Candidate["decl"]) => `${d.prop}: ${d.value}${d.important ? " !important" : ""}`;

const siteOf = (model: Model, selector: string) => {
  const { table } = model;
  for (const [, cls] of selector.matchAll(/\.(_[\w-]+)/g)) {
    const i = table.classes[cls!]?.sites[0];
    const s = i === undefined ? undefined : table.sites[i];
    if (s)
      return `${s.file.startsWith(`${table.root}/`) ? s.file.slice(table.root.length + 1) : s.file}:${s.line}:${s.column + 1}`;
  }
  return undefined;
};

const rule = (model: Model, c: Candidate) => {
  const site = siteOf(model, c.selector);
  return {
    declaration: decl(c.decl),
    selector: c.selector,
    layer: c.layer || "unlayered",
    ...(site ? { site } : {}),
  };
};

const rankOf = (model: Model, layer: string) =>
  layer === "" ? Infinity : (model.rank.get(layer) ?? model.rank.get(layer.split(".")[0]!) ?? -1);

// Why the winner beats another declaration: the first step of the cascade where they differ (cascade.ts `beats`).
const why = (model: Model, w: Candidate, o: Candidate) => {
  if (w.decl.important !== o.decl.important) return "!important";
  if (rankOf(model, w.layer) !== rankOf(model, o.layer))
    return `layer ${w.layer || "unlayered"} ${w.decl.important ? "(!important reverses the layers) " : ""}over ${o.layer || "unlayered"}`;
  const [a, b] = [w.specificity.join(","), o.specificity.join(",")];
  if (a !== b) return `specificity (${a}) over (${b})`;
  return "later in the sheet";
};

const verdicts = (vs: Verdict[]) =>
  vs.map((v) => ({
    property: v.prop,
    check: MARK[v.status],
    computed: v.computed,
    expected: v.expected,
    ...(v.reason ? { reason: v.reason } : {}),
  }));

const failing = (c: Candidate) => c.conditions.filter((x) => !x.holds).map((x) => x.text);

const property = (model: Model, r: Row) => ({
  property: r.prop,
  ...(r.longhands.length > 1 || r.longhands[0] !== r.prop ? { longhands: r.longhands } : {}),
  ...(r.winner
    ? { winner: { ...rule(model, r.winner), conditions: r.winner.conditions.map((c) => c.text) } }
    : { winner: undefined, note: "no declaration of it applies now" }),
  ...(r.lost.length
    ? { except: r.lost.map((l) => ({ longhand: l.prop, by: rule(model, l.by) })) }
    : {}),
  overridden: r.overridden.map((o) => ({
    ...rule(model, o),
    ...(r.winner ? { beatenBy: why(model, r.winner, o) } : {}),
  })),
  inactive: r.inactive.map((o) => ({ ...rule(model, o), failing: failing(o) })),
  verification: verdicts(r.verdicts),
});

const PW_HINT =
  "the browser tools need playwright-core and its Chromium: npx playwright-core install chromium (or an installed Chrome)";

/** A headless Chromium for the session, a page per url, the devtools core in each. */
export class Inspector extends Context.Service<
  Inspector,
  {
    readonly inspectElement: (
      selector: string,
      state: PageState,
    ) => Effect.Effect<InspectResult, ToolError>;
    readonly whyProperty: (
      selector: string,
      prop: string,
      state: PageState,
    ) => Effect.Effect<WhyResult, ToolError>;
  }
>()("@cssints/mcp/browser/Inspector") {
  static readonly layer = Layer.effect(
    Inspector,
    Effect.gen(function* () {
      const live = yield* Live;
      const lock = Semaphore.makeUnsafe(1);
      const state: { browser?: Chromium; bundle?: string } = {};
      const pages = new Map<string, Page>();
      const tables = new WeakMap<Page, unknown>();
      yield* Effect.addFinalizer(() =>
        Effect.promise(() => state.browser?.close() ?? Promise.resolve()),
      );

      const pw = <A>(what: string, f: () => Promise<A>) =>
        Effect.tryPromise({
          try: f,
          catch: (e) =>
            new ToolError({
              message: `${what}: ${Predicate.isError(e) ? e.message.split("\n")[0] : String(e)}`,
            }),
        });

      const bundle = Effect.fn("mcp.browser.bundle")(function* () {
        if (state.bundle) return state.bundle;
        const vite = yield* pw("cannot load vite", () => import("vite"));
        const entry = fileURLToPath(import.meta.resolve("@cssints/devtools/inject"));
        const out = yield* pw("cannot bundle @cssints/devtools/inject", () =>
          vite.build({
            configFile: false,
            logLevel: "silent",
            define: { "process.env.NODE_ENV": '"production"' },
            build: {
              write: false,
              minify: false,
              lib: {
                entry,
                formats: ["iife"],
                name: "__cssintsInject",
                fileName: () => "inject.js",
              },
            },
          }),
        );
        const outputs = (Array.isArray(out) ? out : [out]).flatMap((o) =>
          Predicate.hasProperty(o, "output") ? o.output : [],
        );
        const chunk = outputs.find((o) => o.type === "chunk");
        if (!chunk || chunk.type !== "chunk")
          return yield* new ToolError({ message: "the devtools core did not bundle" });
        state.bundle = chunk.code;
        return chunk.code;
      });

      const browser = Effect.fn("mcp.browser.launch")(function* () {
        if (state.browser?.isConnected()) return state.browser;
        const { chromium } = yield* pw(PW_HINT, () => import("playwright-core"));
        const b = yield* pw(PW_HINT, () => chromium.launch()).pipe(
          Effect.catch(() => pw(PW_HINT, () => chromium.launch({ channel: "chrome" }))),
        );
        state.browser = b;
        return b;
      });

      const page = Effect.fn("mcp.browser.page")(function* (url: string, s: PageState) {
        const known = pages.get(url);
        let p = known && !known.isClosed() ? known : undefined;
        if (!p) {
          const b = yield* browser();
          const fresh = yield* pw("cannot open a page", () =>
            b.newPage({ viewport: { width: s.width ?? 1280, height: s.height ?? 800 } }),
          );
          pages.set(url, fresh);
          yield* pw(`cannot open ${url}`, () => fresh.goto(url));
          p = fresh;
        }
        if (s.width !== undefined || s.height !== undefined) {
          const v = p.viewportSize() ?? { width: 1280, height: 800 };
          yield* pw("cannot resize", () =>
            p.setViewportSize({ width: s.width ?? v.width, height: s.height ?? v.height }),
          );
        }
        return p;
      });

      // The inspection of the element, the page in the state asked for.
      const run = Effect.fn("mcp.browser.inspect")(function* (
        selector: string,
        s: PageState,
        prop?: string,
      ) {
        const url = s.url ?? "http://localhost:5173";
        const model = yield* live.table(s.server ?? new URL("/", url).href);
        const code = yield* bundle();
        const p = yield* page(url, s);
        yield* pw(`no element matches ${selector}`, () =>
          p.waitForSelector(selector, { state: "attached", timeout: 5000 }),
        );
        const injected = yield* pw("cannot read the page", () =>
          p.evaluate(() => Object.hasOwn(globalThis, "__cssintsDevtools")),
        );
        if (!injected) {
          yield* pw("cannot add the devtools core", () => p.addScriptTag({ content: code }));
          tables.delete(p);
        }
        if (tables.get(p) !== model.table) {
          const err = yield* pw("cannot load the table", () =>
            p.evaluate((t) => globalThis.__cssintsDevtools.load(t), model.table),
          );
          if (err) return yield* new ToolError({ message: err });
          tables.set(p, model.table);
        }
        if (s.hover) yield* pw(`cannot hover ${selector}`, () => p.hover(selector));
        else yield* pw("cannot move the pointer", () => p.mouse.move(0, 0));
        if (s.focus) yield* pw(`cannot focus ${selector}`, () => p.focus(selector));
        else yield* pw("cannot blur", () => p.evaluate(() => globalThis.__cssintsDevtools.blur()));
        const out = yield* pw("the inspection failed", () =>
          p.evaluate(({ sel, n }) => globalThis.__cssintsDevtools.inspect(sel, n), {
            sel: selector,
            n: prop,
          }),
        );
        if (Predicate.isString(out)) return yield* new ToolError({ message: out });
        return { model, ...out };
      });

      const inspectElement = Effect.fn("mcp.browser.inspectElement")(function* (
        selector: string,
        s: PageState,
      ) {
        const { model, inspection: i, matches } = yield* lock.withPermit(run(selector, s));
        const root = `${model.table.root}/`;
        return {
          element: i.element,
          matches,
          groups: i.groups.map((g) => ({
            ...(g.site
              ? {
                  site: `${g.site.file.startsWith(root) ? g.site.file.slice(root.length) : g.site.file}:${g.site.line}:${g.site.column + 1}`,
                }
              : {}),
            classes: g.classes.map((c) => ({
              class: c.cls,
              kind: c.kind,
              ...(c.plugin ? { plugin: c.plugin } : {}),
              ...(c.layer ? { layer: c.layer } : {}),
              decls: c.decls.map(decl),
              conditions: c.conditions,
              active: c.active,
            })),
          })),
          properties: i.rows.map((r) => property(model, r)),
          tokens: i.tokens.map((t) => ({
            name: t.name,
            ...(t.path ? { path: t.path } : {}),
            computed: t.computed,
            ...(t.source
              ? {
                  source: `${t.source.selector} (${t.source.layer || "unlayered"}) on ${t.source.on}`,
                }
              : {}),
          })),
        };
      });

      const whyProperty = Effect.fn("mcp.browser.whyProperty")(function* (
        selector: string,
        prop: string,
        s: PageState,
      ) {
        const name = kebab(prop);
        const { model, inspection: i, computed } = yield* lock.withPermit(run(selector, s, name));
        const row =
          i.rows.find((r) => r.prop === name) ??
          i.rows.find((r) => r.longhands.includes(name) && r.winner);
        if (!row)
          return {
            element: i.element,
            property: name,
            computed,
            note: `no cssints rule sets ${name} on this element: the value is inherited, initial, or from another sheet`,
          };
        const w = row.winner;
        const conditions = (c: Candidate) =>
          c.conditions.map((x) => ({ text: x.text, holds: x.holds }));
        const v = row.verdicts.find((x) => x.prop === name) ?? row.verdicts[0];
        return {
          element: i.element,
          property: name,
          computed,
          ...(w
            ? {
                winner: { ...rule(model, w), conditions: conditions(w) },
                beats: row.overridden.map((o) => ({ ...rule(model, o), why: why(model, w, o) })),
              }
            : { note: "no declaration of it applies now" }),
          ...(row.lost.length
            ? { except: row.lost.map((l) => ({ longhand: l.prop, by: rule(model, l.by) })) }
            : {}),
          inactive: row.inactive.map((o) => ({ ...rule(model, o), conditions: conditions(o) })),
          ...(v ? { verification: verdicts([v])[0] } : {}),
        };
      });

      return Inspector.of({ inspectElement, whyProperty });
    }),
  );
}

declare global {
  var __cssintsDevtools: {
    load: (table: unknown) => string | undefined;
    inspect: (
      selector: string,
      prop?: string,
    ) => { inspection: Inspection; matches: number; computed: string } | string;
    blur: () => void;
  };
}

type Rule = ReturnType<typeof rule>;
export interface InspectResult {
  element: string;
  matches: number;
  groups: {
    site?: string;
    classes: {
      class: string;
      kind: string;
      plugin?: string;
      layer?: string;
      decls: string[];
      conditions: Cond[];
      active: boolean;
    }[];
  }[];
  properties: ReturnType<typeof property>[];
  tokens: { name: string; path?: string; computed: string; source?: string }[];
}
export interface WhyResult {
  element: string;
  property: string;
  computed: string;
  note?: string;
  winner?: Rule & { conditions: Cond[] };
  beats?: (Rule & { why: string })[];
  except?: { longhand: string; by: Rule }[];
  inactive?: (Rule & { conditions: Cond[] })[];
  verification?: ReturnType<typeof verdicts>[number];
}
