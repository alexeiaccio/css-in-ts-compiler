// The protocol with the dev server and the state of the inspector: the last table, decoded into a model, and whether it is
// stale. The transport is whatever carries the two events (Vite's HMR channel in the overlay, a port in an extension).
import { Console, Context, Effect, Queue, Ref, Stream, SubscriptionRef } from "effect";

import { toModel, type Model } from "./table.ts";

export const TABLE = "cssints:devtools";
export const STALE = "cssints:devtools:stale";
/** the browser asks the dev server to start an OpenCode session: `{ ref, prompt }` */
export const ASK = "cssints:devtools:ask";
/** the dev server tells how that session goes: an `Asked` */
export const ASKED = "cssints:devtools:asked";

/** `unavailable`: no OpenCode service runs (or its client is not installed); `message` says what to do. */
export interface Asked {
  readonly ref: number;
  readonly status: "running" | "completed" | "failed" | "interrupted" | "unavailable";
  readonly id?: string;
  readonly message?: string;
}

export interface TransportApi {
  /** asks the server for the table (`cssints:devtools:get`); it answers with TABLE */
  readonly request: () => void;
  readonly on: (event: string, listener: (data: unknown) => void) => void;
  /** only when the server has `opencode` on: sends a prompt, the answers come as ASKED; the overlay shows its prompt box if it is set */
  readonly ask?: (ref: number, prompt: string) => void;
}

export class Transport extends Context.Service<Transport, TransportApi>()(
  "@cssints/devtools/core/session/Transport",
) {}

export interface Session {
  /** the model of the last table; undefined until the first one */
  readonly model: SubscriptionRef.SubscriptionRef<Model | undefined>;
  /** an open inspector refetches when the table goes stale; a closed one when it opens */
  readonly setActive: (active: boolean) => Effect.Effect<void>;
}

const events = (transport: TransportApi, event: string) =>
  Stream.callback<unknown>((queue) =>
    Effect.sync(() => transport.on(event, (data) => Queue.offerUnsafe(queue, data))),
  );

/** Listens to the server for as long as the page lives; the first table is asked for when the inspector opens. */
export const session = Effect.fn("devtools.session")(function* () {
  const transport = yield* Transport;
  const model = yield* SubscriptionRef.make<Model | undefined>(undefined);
  const active = yield* Ref.make(false);
  const stale = yield* Ref.make(true);
  const request = Ref.set(stale, false).pipe(
    Effect.andThen(Effect.sync(() => transport.request())),
  );
  const refetch = Effect.gen(function* () {
    if ((yield* Ref.get(active)) && (yield* Ref.get(stale))) yield* request;
  });
  yield* Effect.forkDetach(
    Stream.runForEach(events(transport, TABLE), (data) =>
      toModel(data).pipe(
        Effect.flatMap((m) => SubscriptionRef.set(model, m)),
        Effect.catchTag("TableError", (e) => Console.error(e.message)),
      ),
    ),
  );
  // a cold page load transforms every module: one refetch once they are done
  yield* Effect.forkDetach(
    Stream.runForEach(
      events(transport, STALE).pipe(
        Stream.tap(() => Ref.set(stale, true)),
        Stream.debounce("60 millis"),
      ),
      () => refetch,
    ),
  );
  return {
    model,
    setActive: (on: boolean) => Ref.set(active, on).pipe(Effect.andThen(refetch)),
  } satisfies Session;
});
