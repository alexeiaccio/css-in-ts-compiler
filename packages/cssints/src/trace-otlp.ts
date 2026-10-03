// The runtime of `CSSINTS_TRACE=otlp[:url]`, loaded by trace.ts only then: spans go to <url>/v1/traces over OTLP/HTTP (JSON).
import { Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/unstable/http";
import { OtlpSerialization, OtlpTracer } from "effect/unstable/observability";

export const runtime = ManagedRuntime.make(
  OtlpTracer.layer({
    url: `${process.env.CSSINTS_TRACE?.slice(5).replace(/^:/, "") || "http://localhost:4318"}/v1/traces`,
    resource: { serviceName: "cssints" },
    exportInterval: "500 millis",
  }).pipe(Layer.provide(OtlpSerialization.layerJson), Layer.provide(FetchHttpClient.layer)),
);
// Built now: the sync edges (hotUpdate, load) cannot wait for it.
await runtime.context();
