// Opt-in tracing of the engine (docs/API.md "Debugging"). `CSSINTS_TRACE=otlp[:url]` is read once, when this module loads:
// the hook edges of plugin.ts run on one ManagedRuntime whose layer exports spans over OTLP/HTTP. Unset, `run*`
// are Effect's own functions: no layer, no runtime, no cost. Only the hook-level programs are traced; the per-site edges
// (`__at`, `__site`, in the library) stay untraced on purpose.
import { Cause, Clock, Config, Effect, Predicate } from "effect";

const mode = /^otlp(?::(.+))?$/.exec(
  Effect.runSync(Config.String("CSSINTS_TRACE").pipe(Config.withDefault(""))),
);
const otlp = mode
  ? await import("./trace-otlp.ts").then((m) => m.start(mode[1] ?? "http://localhost:4318"))
  : undefined;
let runtime = otlp;

export const runSync: typeof Effect.runSync = otlp
  ? (e) => (runtime ? runtime.runSync(e) : Effect.runSync(e))
  : Effect.runSync;
export const runPromiseExit: typeof Effect.runPromiseExit = otlp
  ? (e, o?) => (runtime ? runtime.runPromiseExit(e, o) : Effect.runPromiseExit(e, o))
  : Effect.runPromiseExit;

/**
 * Sends what is buffered and stops the exporter, whose timer would keep Node alive (the end of a build, `server.close()`;
 * a script that exits itself calls it first). Later hooks run untraced. A no-op when off.
 * @returns {Promise<void>} resolved when the exporter has stopped
 */
export const closeTrace = (): Promise<void> => {
  const r = runtime;
  runtime = undefined;
  return r ? r.dispose() : Promise.resolve();
};

// One hook of the plugin as a root span with the file as attribute. A failure becomes an event on it (message, file,
// offset) and carries the ids, as `traceId`, `spanId` and a line of its message, to Vite's overlay and the build log.
type ErrorLike = { message: string; file?: string; offset?: number };
const note = (e: ErrorLike) =>
  Effect.flatMap(Effect.all([Effect.currentSpan, Clock.currentTimeNanos]), ([span, now]) =>
    Effect.sync(() => {
      span.event("cssints.error", now, {
        message: e.message,
        file: e.file,
        offset: e.offset,
      });
      Object.assign(e, {
        traceId: span.traceId,
        spanId: span.spanId,
        message: `${e.message} (trace ${span.traceId})`,
      });
    }),
  ).pipe(Effect.ignore);

// `program` as the root span `name` of `file`; `program` itself when tracing is off. */
export const hook: <A, E, R>(
  name: string,
  file: string,
  program: Effect.Effect<A, E, R>,
  environment?: string,
) => Effect.Effect<A, E, R> = otlp
  ? (name, file, program, environment) =>
      program.pipe(
        Effect.tapCause((cause) => {
          const e = Cause.squash(cause) as ErrorLike;
          return Predicate.hasProperty(e, "message") ? note(e) : Effect.void;
        }),
        Effect.withSpan(name, { root: true, attributes: { file, environment } }),
      )
  : (_name, _file, program) => program;

// The support warnings handed to Vite, as events on the current span.
export const warned: (warnings: string[], file?: string) => Effect.Effect<void> = otlp
  ? (ws, file) =>
      Effect.flatMap(Effect.all([Effect.currentSpan, Clock.currentTimeNanos]), ([span, now]) =>
        Effect.sync(() =>
          ws.forEach((message) =>
            span.event("cssints.warning", now, {
              message,
              file,
            }),
          ),
        ),
      ).pipe(Effect.ignore)
  : () => Effect.void;
