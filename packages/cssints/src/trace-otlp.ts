// The runtime of `CSSINTS_TRACE=otlp[:url]`, loaded by trace.ts only then: spans go to <url>/v1/traces over OTLP/HTTP (JSON).
import { Layer, ManagedRuntime } from "effect";
import { FetchHttpClient } from "effect/http";
import { OtlpSerialization, OtlpTracer } from "effect/observability";

// Builds the runtime that exports to `<url>/v1/traces`; it is ready when the promise resolves (the sync edges cannot wait).
export const start = (url: string) => {
  const runtime = ManagedRuntime.make(
    OtlpTracer.layer({
      url: `${url}/v1/traces`,
      resource: { serviceName: "cssints" },
      exportInterval: "500 millis",
    }).pipe(Layer.provide([OtlpSerialization.layerJson, FetchHttpClient.layer])),
  );
  return runtime.context().then(() => runtime);
};
