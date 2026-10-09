// The tools on a running dev server: an app with cssints({ devtools: true }) answers the devtools overlay's request
// (`cssints:devtools:get` → `cssints:devtools`) over Vite's HMR websocket, and so it answers us. One socket per url, kept
// for the session; the table is cached until the server says `cssints:devtools:stale`. The server knows only the
// modules it has served, so the first call fetches every module the page reaches (as a browser would; dynamic imports
// too), and again after an `update` or a `full-reload`: an edited module is transformed again before we read the table.
// Build errors come the same way, as Vite's `error` payloads, sent while a module fails to transform.
import { isAbsolute, relative, resolve } from "node:path";

import { STALE, TABLE, toModel, stripStates, type Model } from "@cssints/devtools/model";
import { Context, Effect, Layer, Option, Schema, Semaphore } from "effect";
import { FetchHttpClient, HttpClient } from "effect/http";

import { ToolError } from "./check.ts";
import { located, Thrown } from "./compile.ts";

export const DEFAULT_URL = "http://localhost:5173";

const Message = Schema.Struct({
  type: Schema.String,
  event: Schema.optional(Schema.String),
  data: Schema.optional(Schema.Unknown),
  err: Schema.optional(Schema.Unknown),
  updates: Schema.optional(Schema.Array(Schema.Struct({ path: Schema.String }))),
});
const decodeMessage = Schema.decodeUnknownOption(Schema.fromJsonString(Message));
const ViteError = Schema.Struct({
  ...Thrown.fields,
  id: Schema.optional(Schema.String),
  plugin: Schema.optional(Schema.String),
  frame: Schema.optional(Schema.String),
});
const decodeError = Schema.decodeUnknownOption(ViteError);
const GET = '{"type":"custom","event":"cssints:devtools:get"}';

export interface LiveError {
  message: string;
  file: string;
  line?: number | undefined;
  column?: number | undefined;
  location: string;
  plugin?: string | undefined;
  frame?: string | undefined;
}

interface Conn {
  readonly url: URL;
  readonly socket: WebSocket;
  model: Model | undefined;
  /** bumped by each stale event: a table asked for before it is not cached */
  gen: number;
  /** false until the modules have been fetched, and again after an update */
  warm: boolean;
  readonly pending: Set<(data: unknown) => void>;
  readonly errors: LiveError[];
}

const noServer = (url: URL) =>
  new ToolError({
    message: `no Vite dev server answers at ${url.href}: start the app's dev server (vite) and pass its url`,
  });
const noDevtools = (url: URL) =>
  new ToolError({
    message: `the dev server at ${url.href} does not answer cssints:devtools:get: turn the devtools on in its vite.config, plugins: [cssints({ devtools: true })], and restart it`,
  });

const onMessage = (conn: Conn, raw: unknown) => {
  const m = Option.getOrUndefined(decodeMessage(String(raw)));
  if (!m) return;
  if (m.type === "custom" && m.event === TABLE) for (const f of conn.pending) f(m.data);
  else if (m.type === "custom" && m.event === STALE) {
    conn.model = undefined;
    conn.gen++;
  } else if (
    m.type === "full-reload" ||
    // the sheet's own updates (`\0virtual:cssints.css`) follow every transform: not an edit
    (m.type === "update" && m.updates?.some((u) => !u.path.startsWith("\0")))
  )
    conn.warm = false;
  else if (m.type === "error") {
    const e = Option.getOrUndefined(decodeError(m.err));
    if (!e) return;
    const at = located(e, e.loc?.file ?? e.id ?? "");
    if (conn.errors.some((x) => x.message === at.message && x.location === at.location)) return;
    conn.errors.push({ ...at, plugin: e.plugin, frame: e.frame });
  }
};

const open = Effect.fn("mcp.live.open")(function* (url: URL) {
  const ws = new URL(url);
  ws.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const socket = yield* Effect.callback<WebSocket, ToolError>((resume) => {
    const s = new WebSocket(ws, "vite-hmr");
    s.addEventListener("open", () => resume(Effect.succeed(s)), { once: true });
    s.addEventListener("error", () => resume(Effect.fail(noServer(url))), { once: true });
  }).pipe(
    Effect.timeoutOrElse({ duration: "5 seconds", orElse: () => Effect.fail(noServer(url)) }),
  );
  const conn: Conn = {
    url,
    socket,
    model: undefined,
    gen: 0,
    warm: false,
    pending: new Set(),
    errors: [],
  };
  socket.addEventListener("message", (e) => onMessage(conn, e.data));
  return conn;
});

const ask = (conn: Conn) =>
  Effect.callback<unknown>((resume) => {
    const f = (data: unknown) => {
      conn.pending.delete(f);
      resume(Effect.succeed(data));
    };
    conn.pending.add(f);
    conn.socket.send(GET);
    return Effect.sync(() => conn.pending.delete(f));
  }).pipe(
    Effect.timeoutOrElse({
      duration: "5 seconds",
      orElse: () => Effect.fail(noDevtools(conn.url)),
    }),
  );

const SCRIPT = /<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["']([^"']+)["']/g;
const IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*)["']([^"'\n]+)["']/g;
// prebundled dependencies and Vite's own modules have no css.* call
const SKIP = /^\/(?:@vite\/|node_modules\/\.vite\/|@react-refresh)/;
// ponytail: a cap for a runaway crawl; an app with more modules than this is read in part
const MAX_MODULES = 3000;

// A class of the table with what an agent asks of it.
const classInfo = (model: Model, cls: string) => {
  const { table, sheet } = model;
  const rec = table.classes[cls];
  if (!rec) return undefined;
  const rules = (model.rulesOf.get(cls) ?? []).flatMap((i) => sheet.rules[i] ?? []);
  const states = rules[0] ? stripStates(rules[0].selector).states : [];
  const css = rec.css ? rec.wrap.reduceRight((inner, w) => `${w}{${inner}}`, rec.css) : "";
  return {
    class: cls,
    kind: rec.kind,
    layer: rec.layer,
    ...(rec.plugin ? { plugin: rec.plugin } : {}),
    conditions: [...rec.wrap, ...new Set(states)],
    css,
    decls: rules.flatMap((r) => r.decls),
    tokens: rec.tokens.map((name) => ({ name, ...table.tokens[name] })),
  };
};

const siteInfo = (model: Model, i: number) => {
  const s = model.table.sites[i]!;
  const file = relative(model.table.root, s.file) || s.file;
  return {
    file,
    line: s.line,
    column: s.column + 1,
    location: `${file}:${s.line}:${s.column + 1}`,
    classes: s.classes,
  };
};

/** The dev servers of the session, one socket per url, closed when the session ends. */
export class Live extends Context.Service<
  Live,
  {
    readonly explain: (classes: string, url?: string) => Effect.Effect<ExplainResult, ToolError>;
    readonly moduleStyles: (file: string, url?: string) => Effect.Effect<ModuleResult, ToolError>;
    readonly errors: (url?: string) => Effect.Effect<ErrorsResult, ToolError>;
    /** the table of a dev server (for the browser inspector) */
    readonly table: (url?: string) => Effect.Effect<Model, ToolError>;
  }
>()("@cssints/mcp/live") {
  static readonly layer = Layer.effect(
    Live,
    Effect.gen(function* () {
      const http = yield* HttpClient.HttpClient;
      const conns = new Map<string, Conn>();
      const lock = Semaphore.makeUnsafe(1);
      yield* Effect.addFinalizer(() =>
        Effect.sync(() => {
          for (const c of conns.values()) c.socket.close();
        }),
      );

      const text = (url: string, accept: string) =>
        http.get(url, { headers: { accept } }).pipe(
          Effect.flatMap((r) => (r.status < 400 ? r.text : Effect.succeed(""))),
          Effect.orElseSucceed(() => ""),
        );

      // Every module the page reaches, fetched once: the server transforms (or takes from its cache) each of them.
      const crawl = Effect.fn("mcp.live.crawl")(function* (conn: Conn) {
        conn.warm = true;
        const origin = conn.url.origin;
        const html = yield* text(conn.url.href, "text/html");
        const seen = new Set<string>();
        let next = [...html.matchAll(SCRIPT), ...html.matchAll(IMPORT)].map(
          (m) => new URL(m[1]!, conn.url).href,
        );
        while (next.length && seen.size < MAX_MODULES) {
          const batch = [...new Set(next)].filter((u) => {
            const at = new URL(u);
            return at.origin === origin && !SKIP.test(at.pathname) && !seen.has(u);
          });
          for (const u of batch) seen.add(u);
          const codes = yield* Effect.forEach(batch, (u) => text(u, "*/*"), { concurrency: 8 });
          next = codes.flatMap((code, i) =>
            [...code.matchAll(IMPORT)].map((m) => new URL(m[1]!, batch[i]).href),
          );
        }
      });

      const connection = Effect.fnUntraced(function* (at: string | undefined) {
        const url = yield* Effect.try({
          try: () => new URL(at ?? DEFAULT_URL),
          catch: () => new ToolError({ message: `not a url: ${at}` }),
        });
        const known = conns.get(url.href);
        if (known && known.socket.readyState === WebSocket.OPEN) return known;
        const conn = yield* open(url);
        conn.socket.addEventListener("close", () => conns.delete(url.href));
        conns.set(url.href, conn);
        return conn;
      });

      const model = Effect.fnUntraced(function* (conn: Conn) {
        if (!conn.warm) yield* crawl(conn);
        if (conn.model) return conn.model;
        const gen = conn.gen;
        const m = yield* toModel(yield* ask(conn)).pipe(
          Effect.mapError((e) => new ToolError({ message: e.message })),
        );
        if (gen === conn.gen) conn.model = m;
        return m;
      });

      const table = (url?: string) => lock.withPermit(Effect.flatMap(connection(url), model));

      const explain = Effect.fn("mcp.live.explain")(function* (classes: string, url?: string) {
        const m = yield* table(url);
        const names = classes.split(/\s+/).flatMap((c) => (c ? [c.replace(/^\./, "")] : []));
        const found: ExplainResult["classes"] = [];
        const unknown: string[] = [];
        for (const cls of names) {
          const info = classInfo(m, cls);
          if (!info) unknown.push(cls);
          else
            found.push({
              ...info,
              sites: m.table.classes[cls]!.sites.map((i) => siteInfo(m, i)),
            });
        }
        if (!found.length)
          return yield* new ToolError({
            message: `${unknown.join(" ")}: not a class the dev server at ${url ?? DEFAULT_URL} has served (cssints' classes start with _; a module that no page imports is not served)`,
          });
        return { root: m.table.root, classes: found, unknown };
      });

      const moduleStyles = Effect.fn("mcp.live.moduleStyles")(function* (
        file: string,
        url?: string,
      ) {
        const m = yield* table(url);
        const abs = isAbsolute(file) ? file : resolve(m.table.root, file);
        const sites = m.table.sites.flatMap((s, i) =>
          s.file === abs
            ? [
                {
                  ...siteInfo(m, i),
                  classes: s.classes.flatMap((c) => classInfo(m, c) ?? []),
                },
              ]
            : [],
        );
        const css = [...new Set(sites.flatMap((s) => s.classes.map((c) => c.css)))].filter(Boolean);
        return {
          file: abs,
          sites,
          css: css.join("\n"),
          ...(sites.length
            ? {}
            : {
                note: `no css.* call of ${abs} is in the table: the file has none, or no page of the app imports it`,
              }),
        };
      });

      const errors = Effect.fn("mcp.live.errors")(function* (url?: string) {
        const conn = yield* connection(url);
        return yield* lock.withPermit(
          Effect.gen(function* () {
            conn.errors.length = 0;
            yield* crawl(conn);
            // the error payloads are sent beside the responses: let the last ones arrive
            yield* Effect.sleep("200 millis");
            return {
              url: conn.url.href,
              errors: [...conn.errors],
              notAvailable:
                "warnings: Vite does not send them to clients (the compile tool reports a module's warnings); runtime errors of the page: only a browser sees them",
            };
          }),
        );
      });

      return Live.of({ explain, moduleStyles, errors, table });
    }),
  ).pipe(Layer.provide(FetchHttpClient.layer));
}

interface ClassInfo {
  class: string;
  kind: "class" | "marker" | "group";
  layer: string;
  plugin?: string;
  conditions: string[];
  css: string;
  decls: { prop: string; value: string; important: boolean }[];
  tokens: { name: string; path?: string; value?: string }[];
}
interface SiteInfo {
  file: string;
  line: number;
  column: number;
  location: string;
  classes: readonly string[];
}
export interface ExplainResult {
  root: string;
  classes: (ClassInfo & { sites: SiteInfo[] })[];
  unknown: string[];
}
export interface ModuleResult {
  file: string;
  sites: (Omit<SiteInfo, "classes"> & { classes: ClassInfo[] })[];
  css: string;
  note?: string;
}
export interface ErrorsResult {
  url: string;
  errors: LiveError[];
  notAvailable: string;
}
